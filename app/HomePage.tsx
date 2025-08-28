"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Zap, Eye, Palette, Scissors, Bot, ChevronLeft, ChevronRight, User, Star, ArrowRight, ArrowLeft, Layers, Shirt, Blend, Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const models = [
  {
    id: "livekit-agent",
    name: "Realtime Talking Agent",
    description: "Interact with a multimodal AI agent in real-time using voice and video.",
    icon: <Mic className="w-6 h-6" />,
    color: "from-sky-500 to-indigo-600",
    staticImage: "/images/agent-placeholder.png",
    gif: "/gifs/agent-anim.gif",
    owner: "Flam AI",
    rating: 5.0,
    uses: "New",
    link: "/models/livekit-agent",
  },
  {
    id: "image-composition",
    name: "Image Composition",
    description: "A Photoshop-like studio to compose images and process with AI.",
    icon: <Blend className="w-6 h-6" />,
    color: "from-purple-500 to-pink-500",
    staticImage: "/images/image-composition.png",
    gif: "/gifs/composition-anim.gif",
    owner: "Vinayak",
    rating: 5.0,
    uses: "1.1K",
    link: "/models/image-composition",
  },
  {
    id: "clothes-swapper",
    name: "Virtual Try-On",
    description: "See how clothes look on different models without a physical fitting.",
    icon: <Shirt className="w-6 h-6" />,
    color: "from-red-500 to-orange-600",
    staticImage: "/images/clothes.png",
    gif: "/gifs/clothes.gif",
    owner: "Vinayak",
    rating: 4.9,
    uses: "4.1K",
    link: "/models/clothes-swapper",
  },
  {
    id: "wall-painting",
    name: "Wall Painting",
    description: "Redesign your space in seconds with Magic Paint AI.",
    icon: <Palette className="w-6 h-6" />,
    color: "from-cyan-400 to-blue-600",
    staticImage: "/images/wall.png",
    gif: "/images/wall.png",
    owner: "Vinayak",
    rating: 4.9,
    uses: "5.1K",
    link: "/models/wall-painting",
  },
  {
    id: "pbr-map-generator",
    name: "PBR Map Generator",
    description: "Create physically-based rendering maps from any image for your 3D assets.",
    icon: <Layers className="w-6 h-6" />,
    color: "from-green-400 to-teal-600",
    staticImage: "/images/pbr.png",
    gif: "/gifs/pbr-anim.gif",
    owner: "Vinayak",
    rating: 4.9,
    uses: "0.8K",
    link: "/models/pbr-map-generator",
  },
  {
    id: "face-swapper",
    name: "Face Swapper",
    description: "Advanced face swapping technology using deep learning.",
    icon: <Eye className="w-6 h-6" />,
    color: "from-purple-400 to-pink-600",
    staticImage: "/images/face.png",
    gif: "/gifs/face.gif",
    owner: "Vinayak",
    rating: 4.8,
    uses: "2.5K",
    link: "/models/face-swapper",
  },
  {
    id: "ghibli",
    name: "Ghibli Style",
    description: "Transform images into the Studio Ghibli art style.",
    icon: <Palette className="w-6 h-6" />,
    color: "from-green-400 to-emerald-600",
    staticImage: "/images/teleport.png",
    gif: "/gifs/teleport.gif",
    owner: "Vinayak",
    rating: 4.9,
    uses: "0.2K",
    link: "/models/ghibli-style",
  },
  {
    id: "segmentation",
    name: "Image Segmentation",
    description: "Precise object detection and segmentation.",
    icon: <Scissors className="w-6 h-6" />,
    color: "from-purple-400 to-pink-600",
    staticImage: "/images/clothes.png",
    gif: "/gifs/clothes.gif",
    owner: "Vinayak",
    rating: 4.7,
    uses: "0.3K",
    link: "https://video-seg.flamapp.ai/",
  },
  {
    id: "chatbot",
    name: "AI Chatbot",
    description: "Intelligent conversational AI assistant",
    icon: <Bot className="w-6 h-6" />,
    color: "from-orange-400 to-red-600",
    staticImage: "/images/segmentation.png",
    gif: "/gifs/segmentation.gif",
    owner: "Vinayak",
    rating: 4.6,
    uses: "0.6K",
    link: "/models/chatbot",
  },
];

const carouselItems = [
  {
    title: "Wall Painting",
    subtitle: "Redesign your space in seconds with Magic Paint AI",
    image: "/images/wall.png",
    gradient: "from-cyan-500 to-blue-600",
    link: "/models/wall-painting",
  },
  {
      title: "Image Composition Studio",
      subtitle: "Combine layers and process with AI in a Photoshop-like interface.",
      image: "/images/image-composition.png",
      gradient: "from-purple-500 to-pink-500",
      link: "/models/image-composition",
    },
    {
      title: "Virtual Try-On",
      subtitle: "See how clothes look on different models without a physical fitting.",
      image: "/images/clothes.png",
      gradient: "from-red-500 to-orange-600",
      link: "/models/clothes-swapper",
    },
    {
      title: "PBR Map Generator",
      subtitle: "Create realistic 3D texture maps from any image.",
      image: "/images/pbr.png",
      gradient: "from-green-500 to-teal-600",
      link: "/models/pbr-map-generator",
    },
];

export default function HomePage() {
  const [activeModel, setActiveModel] = useState("image-composition");
  const [currentPage, setCurrentPage] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  
  const modelsPerPage = 9;
  const totalPages = Math.ceil(models.length / modelsPerPage);

  const getCurrentModels = () => {
    const startIndex = (currentPage - 1) * modelsPerPage;
    return models.slice(startIndex, startIndex + modelsPerPage);
  };

  const nextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const prevCarousel = () => {
    setCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-cyan-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0">
          {[...Array(100)].map((_, i) => (
            <motion.div key={i} className="absolute w-1 h-1 bg-cyan-400 rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }} transition={{ duration: Math.random() * 4 + 2, repeat: Number.POSITIVE_INFINITY, delay: Math.random() * 3 }} />
          ))}
        </div>
      </div>
      <nav className="relative z-10 border-b border-cyan-500/30 backdrop-blur-xl bg-black/60">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex items-center justify-center w-10 h-10">
                  <img src="/flamlogo1.svg" alt="Flam AI Logo" className="w-10 h-10" />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Flam AI Dashboard
                </span>
              </motion.div>
            </Link>
            <div className="hidden lg:flex items-center space-x-6">
              {models.slice(0, 4).map((model, index) => (
                <Link key={model.id} href={model.link} passHref>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setActiveModel(model.id)}
                    className={`relative px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer ${activeModel === model.id ? "text-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-400/25" : "text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10"}`}
                  >
                    <span className="relative z-10">{model.name}</span>
                    {activeModel === model.id && <motion.div layoutId="activeTab" className="absolute inset-0 border-2 border-cyan-400/60 rounded-xl bg-gradient-to-r from-cyan-400/10 to-blue-400/10" />}
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative z-10 py-16 lg:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-8">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">AI Models</span><br />
              <span className="text-white relative">Unleashed<motion.div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 blur-xl" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }} /></span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed">
              Welcome to Flam’s AI Dashboard — your one-stop hub to explore, interact with, and deploy powerful AI models.
              Seamlessly access all your AI tools in one place.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-10 py-4 text-lg rounded-full shadow-2xl shadow-cyan-500/25">
                <Zap className="w-6 h-6 mr-3" /> Explore Models
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative h-80 md:h-96 rounded-3xl overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={carouselIndex} initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -300 }} transition={{ duration: 0.5 }} className={`absolute inset-0 bg-gradient-to-r ${carouselItems[carouselIndex].gradient} rounded-3xl`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative h-full flex items-center justify-between p-8 md:p-12">
                  <div className="flex-1">
                    <motion.h3 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl md:text-5xl font-bold text-white mb-4">{carouselItems[carouselIndex].title}</motion.h3>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-lg md:text-xl text-white/90 mb-6">{carouselItems[carouselIndex].subtitle}</motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                      <Button asChild className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm">
                        <Link href={carouselItems[carouselIndex].link || "#"}>
                          Try Model <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </motion.div>
                  </div>
                  <div className="hidden md:block flex-1"><img src={carouselItems[carouselIndex].image} alt={carouselItems[carouselIndex].title} className="w-full h-64 object-cover rounded-2xl" /></div>
                </div>
              </motion.div>
            </AnimatePresence>
            <button onClick={prevCarousel} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300"><ChevronLeft className="w-6 h-6 text-white" /></button>
            <button onClick={nextCarousel} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300"><ChevronRight className="w-6 h-6 text-white" /></button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {carouselItems.map((_, index) => (<button key={index} onClick={() => setCarouselIndex(index)} className={`w-3 h-3 rounded-full transition-all duration-300 ${index === carouselIndex ? "bg-white" : "bg-white/40"}`} />))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-3xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Featured AI Models
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getCurrentModels().map((model, index) => (
              <motion.div key={model.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -8, scale: 1.02 }} onMouseEnter={() => setHoveredModel(model.id)} onMouseLeave={() => setHoveredModel(null)} className="group">
                <Card className="bg-gradient-to-br from-gray-900/80 to-black/80 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-sm h-full flex flex-col">
                  <CardContent className="p-4 flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${model.color}`}>{model.icon}</div>
                      <div className="flex items-center space-x-1"><Star className="w-4 h-4 text-yellow-400 fill-current" /><span className="text-sm text-gray-300">{model.rating}</span></div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{model.name}</h3>
                    <div className="flex items-center mb-3"><User className="w-3 h-3 text-gray-400 mr-1" /><Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300 border-gray-700">{model.owner}</Badge></div>
                    <div className="relative mb-4 rounded-lg overflow-hidden">
                      <img src={hoveredModel === model.id ? model.gif : model.staticImage} alt={`${model.name} demonstration`} className="w-full h-32 object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <motion.div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" whileHover={{ scale: 1.05 }} />
                      <div className="absolute bottom-2 right-2 text-xs text-white/80 bg-black/50 px-2 py-1 rounded">{model.uses} uses</div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">{model.description}</p>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-auto">
                      <Button asChild className={`w-full bg-gradient-to-r ${model.color} hover:opacity-90 text-white text-sm py-2`}>
                        <Link href={model.link || "#"}>
                          Try Model
                        </Link>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 space-x-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="border-gray-700 text-gray-300 hover:bg-gray-800"><ArrowLeft className="w-4 h-4 mr-1" /> Previous</Button>
              <div className="flex space-x-1">
                {[...Array(totalPages)].map((_, index) => (<Button key={index + 1} variant={currentPage === index + 1 ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(index + 1)} className={currentPage === index + 1 ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "border-gray-700 text-gray-300 hover:bg-gray-800"}>{index + 1}</Button>))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="border-gray-700 text-gray-300 hover:bg-gray-800">Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </div>
          )}
        </div>
      </section>
      <section className="relative z-10 py-20 border-t border-cyan-500/20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[{ number: "10M+", label: "Models Deployed" }, { number: "99.9%", label: "Uptime" }, { number: "50ms", label: "Avg Response Time" }, { number: "500K+", label: "Active Users" }].map((stat, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.2 }} className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 hover:border-cyan-500/30 transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">{stat.number}</div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}