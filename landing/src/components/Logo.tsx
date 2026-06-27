import Lottie from 'lottie-react';
import logo from '../assets/logo.json';

/** Animated Clockout brand mark — the same logo.json used in the mobile app. */
export default function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <Lottie
      animationData={logo}
      loop
      autoplay
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
