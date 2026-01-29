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
    const isRunningRef = useRef(false);

    useEffect(() => {
        if (!user) return;

        console.log('Schedule Worker initialized.');
        isRunningRef.current = true;

        const runLoop = async () => {
            while (isRunningRef.current) {
                // Try to acquire the "Master Worker" lock
                try {
                    // We use ifAvailable: true to avoid queuing. 
                    // If another tab has the lock, this call returns immediately with null.
                    await navigator.locks.request('pet_feeder_worker_lock', { ifAvailable: true }, async (lock) => {
                        if (!lock) {
                            // Another tab is the master
                            return;
                        }

                        // We are the master! Run the check.
                        await checkSchedules();

                        // Wait for the next minute while holding the lock briefly 
                        // or just release and wait outside. Releasing/re-requesting 
                        // every minute is safer for tab closure handling.
                    });
                } catch (err) {
                    console.error('[Worker Lock Error]:', err);
                }

                // Wait 60s before trying to become master again
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        };

        runLoop();

        return () => {
            isRunningRef.current = false;
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
