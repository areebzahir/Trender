'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { motion } from "framer-motion";
import { Sofa, Lamp, Coffee, Sparkles } from "lucide-react";

export function FurnitureScene() {
  return (
    <Card className="w-full h-[500px] bg-gradient-to-br from-[#F5F3EF] to-[#E2E0DA] relative overflow-hidden border-0 shadow-2xl">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
      />
      
      <div className="flex h-full">
        {/* Left content */}
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6 text-[#C24E40]" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-[#2B2B2B] to-[#7D7D7D]">
                Discover Your Style
              </h1>
            </div>
            <p className="mt-4 text-[#7D7D7D] max-w-lg text-lg leading-relaxed">
              Explore our curated collection of premium furniture. From cozy sofas to elegant lighting, 
              find pieces that transform your space into a haven of comfort and style.
            </p>
            
            {/* Furniture icons */}
            <div className="flex gap-4 mt-6">
              <motion.div
                whileHover={{ scale: 1.1, y: -5 }}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
              >
                <Sofa className="w-5 h-5 text-[#C24E40]" />
                <span className="text-sm font-medium text-[#2B2B2B]">Sofas</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1, y: -5 }}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
              >
                <Lamp className="w-5 h-5 text-[#C24E40]" />
                <span className="text-sm font-medium text-[#2B2B2B]">Lighting</span>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1, y: -5 }}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
              >
                <Coffee className="w-5 h-5 text-[#C24E40]" />
                <span className="text-sm font-medium text-[#2B2B2B]">Tables</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Right content - 3D Furniture Scene */}
        <div className="flex-1 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-full h-full"
          >
            {/* Placeholder for 3D scene - you can replace this with actual Spline scene */}
            <div className="w-full h-full bg-gradient-to-br from-[#F7F4F0] to-[#F4E3E1] rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-20 h-20 bg-[#C24E40]/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 bg-[#6F7C62]/10 rounded-full blur-xl"></div>
              
              {/* Furniture silhouette */}
              <div className="relative z-10">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="flex items-end gap-6"
                >
                  {/* Sofa */}
                  <div className="relative">
                    <div className="w-32 h-20 bg-gradient-to-b from-[#C24E40] to-[#A63A2B] rounded-t-2xl shadow-lg"></div>
                    <div className="w-32 h-8 bg-gradient-to-b from-[#A63A2B] to-[#8B2E1F] rounded-b-2xl shadow-lg"></div>
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-[#F4E3E1] rounded-full shadow-md"></div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#F4E3E1] rounded-full shadow-md"></div>
                  </div>
                  
                  {/* Side table */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-b from-[#6F7C62] to-[#5E5B58] rounded-full shadow-lg"></div>
                    <div className="w-16 h-2 bg-[#5E5B58] rounded-full shadow-md mt-2"></div>
                  </div>
                  
                  {/* Lamp */}
                  <div className="relative">
                    <div className="w-2 h-16 bg-[#5E5B58] rounded-full shadow-md"></div>
                    <div className="w-8 h-8 bg-gradient-to-b from-[#F4E3E1] to-[#E2E0DA] rounded-full shadow-lg -mt-4 ml-[-12px]"></div>
                  </div>
                </motion.div>
                
                {/* Floating elements */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 w-4 h-4 bg-[#C24E40]/20 rounded-full"
                ></motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 left-0 w-3 h-3 bg-[#6F7C62]/20 rounded-full"
                ></motion.div>
              </div>
              
              {/* Overlay text */}
              <div className="absolute bottom-4 right-4 text-right">
                <p className="text-xs text-[#7D7D7D] font-medium">Interactive 3D</p>
                <p className="text-xs text-[#C24E40] font-bold">Furniture Preview</p>
              </div>
            </div>
            
            {/* You can replace the above placeholder with actual Spline scene */}
            {/* <SplineScene 
              scene="YOUR_SPLINE_SCENE_URL"
              className="w-full h-full"
            /> */}
          </motion.div>
        </div>
      </div>
    </Card>
  )
} 