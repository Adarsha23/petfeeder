-- Enable pg_cron extension (may already be enabled; safe to run)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: finds feeding events stuck in PENDING/IN_PROGRESS for >2 minutes,
-- marks them FAILED, and creates an in-app notification for each one.
CREATE OR REPLACE FUNCTION mark_stale_feeding_events_failed()
RETURNS void AS $$
DECLARE
    stale RECORD;
BEGIN
    FOR stale IN
        SELECT fe.id, fe.user_id, fe.device_id, fe.pet_id, fe.target_grams,
               COALESCE(pp.name, 'your pet') AS pet_name,
               COALESCE(d.device_name, 'your feeder') AS device_name
        FROM feeding_events fe
        LEFT JOIN pet_profiles pp ON pp.id = fe.pet_id
        LEFT JOIN devices d ON d.id = fe.device_id
        WHERE fe.status IN ('PENDING', 'IN_PROGRESS')
          AND fe.timestamp < NOW() - INTERVAL '2 minutes'
    LOOP
        -- Mark event as failed
        UPDATE feeding_events
        SET status = 'FAILED',
            completed_at = NOW()
        WHERE id = stale.id;

        -- Also mark the linked command as failed so the UI reflects it
        UPDATE command_queue
        SET status = 'FAILED'
        WHERE status IN ('PENDING', 'DELIVERED')
          AND device_id = stale.device_id
          AND (payload->>'feeding_event_id')::uuid = stale.id;

        -- Create in-app notification
        INSERT INTO notifications (user_id, device_id, type, title, message, metadata)
        VALUES (
            stale.user_id,
            stale.device_id,
            'FEED_FAILED',
            'Feeding failed',
            'A scheduled feeding of ' || stale.target_grams || 'g for ' || stale.pet_name || ' did not complete on ' || stale.device_name || '.',
            jsonb_build_object('feeding_event_id', stale.id, 'pet_id', stale.pet_id)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: run every minute
SELECT cron.schedule(
    'mark-stale-feedings',
    '* * * * *',
    'SELECT mark_stale_feeding_events_failed()'
);
