-- Function: runs every minute, checks active feeding schedules, and dispatches
-- feed commands for any scheduled time that falls within the current minute.
-- Uses a dispatched_feedings table to prevent double-firing.

CREATE TABLE IF NOT EXISTS dispatched_feedings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES feeding_schedules(id) ON DELETE CASCADE,
    feeding_time TEXT NOT NULL,       -- "HH:MM"
    feeding_date DATE NOT NULL,       -- date it was dispatched
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (schedule_id, feeding_time, feeding_date)
);

-- Clean up old dispatch records (older than 2 days) to keep the table small
CREATE OR REPLACE FUNCTION cleanup_dispatched_feedings()
RETURNS void AS $$
BEGIN
    DELETE FROM dispatched_feedings WHERE feeding_date < CURRENT_DATE - INTERVAL '2 days';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION dispatch_scheduled_feedings()
RETURNS void AS $$
DECLARE
    sched RECORD;
    feeding JSONB;
    feeding_time TEXT;
    portion_grams NUMERIC;
    today_dow INTEGER;
    now_time TEXT;
    today_date DATE;
    token TEXT;
    event_id UUID;
BEGIN
    today_dow  := EXTRACT(DOW FROM NOW() AT TIME ZONE 'UTC');
    now_time   := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'HH24:MI');
    today_date := (NOW() AT TIME ZONE 'UTC')::DATE;

    FOR sched IN
        SELECT fs.id, fs.user_id, fs.device_id, fs.pet_id,
               fs.feeding_times, fs.days_of_week
        FROM feeding_schedules fs
        WHERE fs.is_active = true
          AND today_dow = ANY(fs.days_of_week)
    LOOP
        FOR feeding IN SELECT * FROM jsonb_array_elements(sched.feeding_times)
        LOOP
            feeding_time  := feeding->>'time';
            portion_grams := (feeding->>'portion_grams')::numeric;

            -- Only fire if current minute matches schedule time
            IF feeding_time <> now_time THEN
                CONTINUE;
            END IF;

            -- Skip if already dispatched for this schedule+time+date
            IF EXISTS (
                SELECT 1 FROM dispatched_feedings
                WHERE schedule_id = sched.id
                  AND feeding_time = feeding_time
                  AND feeding_date = today_date
            ) THEN
                CONTINUE;
            END IF;

            -- Create feeding_event
            INSERT INTO feeding_events (device_id, user_id, pet_id, target_grams, status)
            VALUES (sched.device_id, sched.user_id, sched.pet_id, portion_grams, 'PENDING')
            RETURNING id INTO event_id;

            -- Create command in queue
            token := EXTRACT(EPOCH FROM NOW())::TEXT || '-' || sched.id || '-' || feeding_time;
            INSERT INTO command_queue (device_id, user_id, command_type, payload, status, idempotency_token, priority)
            VALUES (
                sched.device_id,
                sched.user_id,
                'FEED',
                jsonb_build_object(
                    'grams', portion_grams,
                    'target_grams', portion_grams,
                    'pet_id', sched.pet_id,
                    'feeding_event_id', event_id,
                    'source', 'schedule'
                ),
                'PENDING',
                token,
                0
            );

            -- Mark as dispatched
            INSERT INTO dispatched_feedings (schedule_id, feeding_time, feeding_date)
            VALUES (sched.id, feeding_time, today_date);

        END LOOP;
    END LOOP;

    -- Cleanup old records
    PERFORM cleanup_dispatched_feedings();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: run every minute
SELECT cron.schedule(
    'dispatch-scheduled-feedings',
    '* * * * *',
    'SELECT dispatch_scheduled_feedings()'
);
