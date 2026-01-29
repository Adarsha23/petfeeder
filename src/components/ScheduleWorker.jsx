import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSchedules } from '../services/scheduleService';
import { queueFeedCommand } from '../services/commandService';

/**
 * ScheduleWorker
 * A background worker that simulates the "Cloud Scheduler" or "Feeder Logic"
 * It checks active schedules every minute and triggers feeding commands.
 */
const ScheduleWorker = () => {
    const { user } = useAuth();
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        console.log('Schedule Worker Started: Monitoring routines...');

        // Run check every 60 seconds
        intervalRef.current = setInterval(() => {
            checkSchedules();
        }, 60000);

        // Run an immediate check on mount
        checkSchedules();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            console.log('Schedule Worker Stopped.');
        };
    }, [user]);

    const checkSchedules = async () => {
        try {
            const now = new Date();
            const currentDay = now.getDay(); // 0-6 (Sun-Sat)
            const currentTime = now.toTimeString().substring(0, 5); // "HH:mm"
            const todayDate = now.toISOString().split('T')[0]; // "YYYY-MM-DD"

            // Get processed feedings from localStorage
            const processedKey = `processed_feedings_${user.id}`;
            let processed = JSON.parse(localStorage.getItem(processedKey) || '{}');

            const { data: schedules, error } = await getSchedules();
            if (error) throw error;

            const activeSchedules = schedules.filter(s => s.is_active);

            for (const schedule of activeSchedules) {
                // Check if today matches schedule days
                if (!schedule.days_of_week.includes(currentDay)) continue;

                for (const feeding of schedule.feeding_times) {
                    const timeMatch = feeding.time === currentTime;

                    if (timeMatch) {
                        const feedingId = `${schedule.id}_${feeding.time}`;

                        // Check if already processed today
                        if (processed[feedingId] === todayDate) {
                            console.log(`[Worker] Avoiding duplicate feed for ${schedule.name} at ${feeding.time}`);
                            continue;
                        }

                        console.log(`[Worker] 🚀 Triggering schedule: ${schedule.name} (${feeding.time})`);

                        // Queue the command
                        await queueFeedCommand(
                            schedule.device_id,
                            feeding.portion_grams,
                            schedule.pet_id
                        );

                        // Mark as processed centrally for today
                        processed[feedingId] = todayDate;
                        localStorage.setItem(processedKey, JSON.stringify(processed));
                    }
                }
            }

            // Cleanup old processed dates from localStorage to save space (older than today)
            let cleaned = false;
            Object.keys(processed).forEach(key => {
                if (processed[key] !== todayDate) {
                    delete processed[key];
                    cleaned = true;
                }
            });
            if (cleaned) localStorage.setItem(processedKey, JSON.stringify(processed));

        } catch (err) {
            console.error('[Worker Error]:', err.message);
        }
    };

    return null; // Side effect only component
};

export default ScheduleWorker;
