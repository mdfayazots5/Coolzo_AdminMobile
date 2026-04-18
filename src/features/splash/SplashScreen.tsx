/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/auth-store';
import { useAppStore } from '../../store/app-store';

export default function SplashScreen() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializeApp = useAppStore((state) => state.initialize);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeAuth();
      initializeApp();
    }, 1500); // 1.5s max display as per blueprint

    return () => clearTimeout(timer);
  }, [initializeAuth, initializeApp]);

  return (
    <div className="fixed inset-0 bg-brand-navy flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-brand-gold rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-brand-gold/20">
          <span className="text-brand-navy text-4xl font-bold tracking-tighter">C</span>
        </div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-brand-gold text-3xl font-bold tracking-[0.2em] uppercase"
        >
          Coolzo
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-brand-muted text-xs mt-2 tracking-widest uppercase"
        >
          Premium AC Service Platform
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="w-48 h-1 bg-brand-surface rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-brand-gold"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
