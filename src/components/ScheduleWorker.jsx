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

                // Wait 3s before trying to become master again (faster response time)
                await new Promise(resolve => setTimeout(resolve, 3000));
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
            const currentTimeWithSeconds = now.toTimeString().substring(0, 8); // "HH:mm:ss"
            const todayDate = now.toISOString().split('T')[0]; // "YYYY-MM-DD"

            // Debug logging
            console.log(`[Worker] 🕐 Checking schedules at ${currentTimeWithSeconds} (Day: ${currentDay})`);

            // Get processed feedings from localStorage
            const processedKey = `processed_feedings_${user.id}`;
            let processed = JSON.parse(localStorage.getItem(processedKey) || '{}');

            const { data: schedules, error } = await getSchedules();
            if (error) throw error;

            const activeSchedules = schedules.filter(s => s.is_active);
            console.log(`[Worker] 📋 Found ${activeSchedules.length} active schedules`);

            for (const schedule of activeSchedules) {
                // Check if today matches schedule days
                if (!schedule.days_of_week.includes(currentDay)) {
                    console.log(`[Worker] ⏭️  Skipping "${schedule.name}" - not scheduled for day ${currentDay}`);
                    continue;
                }

                console.log(`[Worker] ✓ Checking "${schedule.name}" - ${schedule.feeding_times.length} feeding times`);

                for (const feeding of schedule.feeding_times) {
                    // Check if currentTime is exactly the same OR if we're within a 30m "catch-up" window
                    // This handles cases where the app was opened slightly after the scheduled time
                    const [feedH, feedM] = feeding.time.split(':').map(Number);
                    const [currH, currM] = currentTime.split(':').map(Number);

                    const feedTotalMin = feedH * 60 + feedM;
                    const currTotalMin = currH * 60 + currM;

                    // Trigger if it's the exact minute OR if we're up to 30 mins late
                    const isWithinWindow = (currTotalMin >= feedTotalMin) && (currTotalMin < feedTotalMin + 30);

                    console.log(`[Worker]   ⏰ Time ${feeding.time}: feedMin=${feedTotalMin}, currMin=${currTotalMin}, diff=${currTotalMin - feedTotalMin}m, inWindow=${isWithinWindow}`);

                    if (isWithinWindow) {
                        const feedingId = `${schedule.id}_${feeding.time}`;

                        // Check if already processed today
                        if (processed[feedingId] === todayDate) {
                            console.log(`[Worker]   ⏭️  Already processed today: ${feedingId}`);
                            continue;
                        }

                        console.log(`[Worker] 🚀 TRIGGERING: ${schedule.name} (${feeding.time}) - ${currTotalMin - feedTotalMin}m late`);

                        // Queue the command
                        try {
                            await queueFeedCommand(
                                schedule.device_id,
                                feeding.portion_grams,
                                schedule.pet_id
                            );

                            // Mark as processed centrally for today
                            processed[feedingId] = todayDate;
                            localStorage.setItem(processedKey, JSON.stringify(processed));
                            console.log(`[Worker] ✅ Successfully queued feed command for ${schedule.name}`);
                        } catch (cmdErr) {
                            console.error('[Worker] ❌ Command failed:', cmdErr);
                        }
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
