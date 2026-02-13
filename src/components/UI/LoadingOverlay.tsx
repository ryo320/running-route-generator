import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
    message?: string;
}

const RunnerIcon = () => {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame((prev) => (prev + 1) % 18);
        }, 36);
        return () => clearInterval(interval);
    }, []);

    // Biomechanical Running Cycle Calculator
    const getLimbCoords = (f: number, offset: number = 0) => {
        let cycle = (f / 18 + offset) % 1;
        const STANCE_DURATION = 0.35;

        let kneeX, kneeY, footX, footY;

        if (cycle < STANCE_DURATION) {
            // STANCE
            const p = cycle / STANCE_DURATION;
            footX = 65 - (p * 35);
            footY = 100;
            const flexion = Math.sin(p * Math.PI) * 6;
            kneeX = 58 + (p * 5);
            kneeY = 75 + flexion;
        } else {
            // SWING
            const swingP = (cycle - STANCE_DURATION) / (1 - STANCE_DURATION);

            if (swingP < 0.35) {
                // FOLD
                const p = swingP / 0.35;
                footX = 30 + (p * 15);
                footY = 100 - (Math.sin(p * Math.PI / 2) * 45);
                kneeX = 63 - (p * 8);
                kneeY = 75 - (p * 5);
            } else if (swingP < 0.75) {
                // DRIVE
                const p = (swingP - 0.35) / 0.4;
                kneeX = 55 + (p * 23);
                kneeY = 70 - (p * 10);
                footX = 45 + (p * 15);
                footY = 55 + (p * 10);
            } else {
                // EXTENSION
                const p = (swingP - 0.75) / 0.25;
                kneeX = 78 - (p * 8);
                kneeY = 60 + (p * 15);
                footX = 60 + (p * 5);
                footY = 65 + (p * 35);
            }
        }
        return { footX, footY, kneeX, kneeY };
    };

    const rLeg = getLimbCoords(frame, 0);
    const lLeg = getLimbCoords(frame, 0.5);
    const bounceY = (Math.sin((frame / 18) * Math.PI * 2 * 2 - Math.PI * 0.8) * 3);

    // CORRECTED PENDULUM ARM SWING
    // Previous issue: Coordinates inverted, arm swinging ONLY in front (0 to -90).
    // Correction: 0 is Vertical Down.
    // + is Backward (CCW in SVG if Y is Down? No, CW is +, Y down).
    // Let's verify: 
    // 0 deg -> cos(90) = 0, sin(90) = 1 -> (0, 1) -> Down. Correct.
    // +45 deg -> cos(135) = -0.7, sin(135) = 0.7 -> (-0.7, 0.7). Back Down. Correct.

    // We want:
    // Back Phase: +110 deg (Way back/up).
    // Front Phase: -30 deg (Slightly forward).

    // Center: +40. Amplitude: 70.
    // Wave 1 -> 40 + 70 = 110.
    // Wave -1 -> 40 - 70 = -30.

    const getArmCoords = (f: number, legOffset: number) => {
        let cycle = (f / 18 + legOffset + 0.5) % 1;

        const sX = 56;
        const sY = 32;
        const UPPER_LEN = 15;
        const FORE_LEN = 15;

        const armCycleRad = cycle * Math.PI * 2;
        const phaseShift = 0.35;
        const wave = Math.cos(armCycleRad - (phaseShift * Math.PI * 2));

        // CORRECTION: Positive is BACK.
        const shoulderAngle = 40 + (wave * 70);

        const sRad = (shoulderAngle + 90) * Math.PI / 180;

        const elbowX = sX + Math.cos(sRad) * UPPER_LEN;
        const elbowY = sY + Math.sin(sRad) * UPPER_LEN;

        // ELBOW BEND - FIXED "V" (Ku-no-ji)
        const bendAngle = 85;

        const bendRad = bendAngle * Math.PI / 180;
        const fRad = sRad - Math.PI + bendRad;

        const handX = elbowX + Math.cos(fRad) * FORE_LEN;
        const handY = elbowY + Math.sin(fRad) * FORE_LEN;

        return { handX, handY, elbowX, elbowY };
    };

    const rArm = getArmCoords(frame, 0);
    const lArm = getArmCoords(frame, 0.5);

    return (
        <svg viewBox="0 0 100 100" className="w-24 h-24 overflow-visible">
            <g transform={`translate(0, ${bounceY})`}>
                <circle cx="66" cy="18" r="7" fill="#3b82f6" />
                <path d="M55 30 L65 30 L60 58 L50 58 Z" fill="#3b82f6" transform="rotate(14 59 44)" />

                {/* Left Side (Back) */}
                <path d={`M58 32 Q ${lArm.elbowX} ${lArm.elbowY}, ${lArm.handX} ${lArm.handY}`}
                    stroke="#3b82f6" strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d={`M55 58 Q ${lLeg.kneeX} ${lLeg.kneeY}, ${lLeg.footX} ${lLeg.footY}`}
                    stroke="#3b82f6" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.6" />

                {/* Right Side (Front) */}
                <path d={`M55 58 Q ${rLeg.kneeX} ${rLeg.kneeY}, ${rLeg.footX} ${rLeg.footY}`}
                    stroke="#3b82f6" strokeWidth="10" strokeLinecap="round" fill="none" />
                <path d={`M58 32 Q ${rArm.elbowX} ${rArm.elbowY}, ${rArm.handX} ${rArm.handY}`}
                    stroke="#3b82f6" strokeWidth="9" strokeLinecap="round" fill="none" />
            </g>
        </svg>
    );
};

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = "Loading..." }) => {
    return (
        <div className="absolute inset-0 z-[500] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-6">
                <div className="relative flex flex-col items-center pt-8">
                    <RunnerIcon />

                    <div className="w-48 h-8 relative overflow-hidden mt-6 opacity-40">
                        <div className="absolute top-2 w-[200%] h-1 bg-blue-500 rounded-full animate-ground-flow" style={{ animationDuration: '0.35s' }}></div>
                        <div className="absolute top-6 w-[200%] h-1 bg-blue-400 rounded-full animate-ground-flow" style={{ animationDuration: '0.5s', left: '-50%' }}></div>
                    </div>
                </div>

                <p className="text-blue-600 font-bold italic tracking-widest uppercase animate-pulse text-lg">
                    {message}
                </p>
            </div>
        </div>
    );
};

export default LoadingOverlay;
