'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { motion } from "framer-motion";
import { Zap, Sparkles, Cpu, Eye } from "lucide-react";
import { useState } from "react";

export function RobotScene() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const furnitureImages = [
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80',
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80'
  ];

  const handleImageClick = () => {
    // Switch back and forth between the two images
    setCurrentImageIndex(currentImageIndex === 0 ? 1 : 0);
  };
  return (
    <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden border-0 shadow-2xl">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        size={300}
      />

      <div className="flex h-full">
        {/* Left content - Single Dark Furniture */}
        <div className="flex-1 relative z-10 p-6">
          {/* Floating decorative elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-4 right-4 w-3 h-3 bg-white/40 rounded-full z-20"
          ></motion.div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            className="absolute bottom-4 left-4 w-2 h-2 bg-white/30 rounded-full z-20"
          ></motion.div>

          {/* Luxury classy furniture */}
          <motion.div
            className="h-full relative overflow-hidden rounded-lg shadow-2xl cursor-pointer"
            onClick={handleImageClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('${furnitureImages[currentImageIndex]}')`
              }}
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Elegant overlay to blend with robot */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/10 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

              {/* Click indicator */}
              <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-xs text-white font-medium">
                  {currentImageIndex === 0 ? 'Click to switch' : 'Click to switch back'}
                </span>
              </div>

              {/* Image counter */}
              <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                <span className="text-xs text-white">{currentImageIndex === 0 ? 'Original' : 'Switched'}</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Full width 3D Robot Scene */}
        <div className="flex-1 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-full h-full"
          >
            {/* 3D Robot Scene */}
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />

            {/* You can replace the above placeholder with actual Spline scene */}
            {/* <SplineScene 
              scene="YOUR_SPLINE_ROBOT_SCENE_URL"
              className="w-full h-full"
            /> */}
          </motion.div>
        </div>
      </div>
    </Card>
  )
} 