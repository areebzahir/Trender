'use client'

import { Card } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"
import { motion } from "framer-motion";
import { Sofa, Lamp, Coffee, Sparkles, Heart, ShoppingCart } from "lucide-react";

export function FurnitureImageScene() {
  return (
    <Card className="w-full h-[500px] bg-gradient-to-br from-[#F5F3EF] to-[#E2E0DA] relative overflow-hidden border-0 shadow-2xl">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        size={300}
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
            
            {/* Action buttons */}
            <div className="flex gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-[#C24E40] text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Heart className="w-5 h-5" />
                <span className="font-medium">Save to Wishlist</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-[#C24E40]/20 hover:bg-white transition-all duration-200"
              >
                <ShoppingCart className="w-5 h-5 text-[#C24E40]" />
                <span className="font-medium text-[#2B2B2B]">Add to Cart</span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Right content - Beautiful Furniture Image */}
        <div className="flex-1 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-full h-full relative overflow-hidden rounded-lg"
          >
            {/* High-quality furniture image */}
            <div className="w-full h-full bg-cover bg-center relative" style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80')`
            }}>
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent"></div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg"
              >
                <span className="text-sm font-bold text-[#C24E40]">Premium</span>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg"
              >
                <span className="text-sm font-bold text-[#6F7C62]">Handcrafted</span>
              </motion.div>
              
              {/* Decorative elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/4 right-1/4 w-2 h-2 bg-[#C24E40]/60 rounded-full"
              ></motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-[#6F7C62]/60 rounded-full"
              ></motion.div>
            </div>
            
            {/* Image overlay text */}
            <div className="absolute bottom-4 right-4 text-right">
              <p className="text-xs text-white/80 font-medium">Luxury Living</p>
              <p className="text-xs text-white font-bold">Modern Sofa Collection</p>
            </div>
          </motion.div>
        </div>
      </div>
    </Card>
  )
} 