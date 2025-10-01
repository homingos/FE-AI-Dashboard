// /app/models/wall-painting-v2/page.tsx

"use client";

import { AnimatedBackground } from "@/components/ui/animated-background";
import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, Palette, Sparkles, Loader2, CheckCircle2, XCircle, ArrowLeft,
  Server, Download, Expand, X, Paintbrush, Undo2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NEW_COLORS = [
  { name: "Betel Leaf", hex: "#5F7C6A" },
  { name: "Smoky Mountain", hex: "#A7A59C" },
  { name: "Iranian Turquoise", hex: "#72ADB6" },
  { name: "Beach House", hex: "#CBC1A9" },
  { name: "Spice", hex: "#EAD2BE" },
  { name: "Prairie Island", hex: "#C17C6D" },
  { name: "Apricot Cream", hex: "#B98D89" },
  { name: "Warm Tobacco", hex: "#6A5D64" },
  { name: "Tea Rose", hex: "#A57D76" },
  { name: "Purple Martini-N", hex: "#8F588E" },
  { name: "Regal Air-N", hex: "#4C4556" },
  { name: "Rajputana Purple-N", hex: "#656195" },
  { name: "Purple Pansy", hex: "#6E6C7B" },
  { name: "Night Swimming-N", hex: "#384251" },
  { name: "Mariner’s Muse-N", hex: "#1D739D" },
  { name: "Isle of Capri", hex: "#517D87" },
  { name: "Reef Green", hex: "#2B5D5F" },
  { name: "Shifting Tide-N", hex: "#00896C" },
  { name: "Seasoning", hex: "#7BBB63" },
  { name: "Okra Green-N", hex: "#697C47" },
  { name: "Forest Night-N", hex: "#3F5340" },
  { name: "Muddy Mustard-N", hex: "#B9A535" },
  { name: "Moss Mud-N", hex: "#62593C" },
  { name: "Mrig-N", hex: "#CC993F" },
  { name: "Rustic Earth-N", hex: "#A2653E" },
  { name: "Tic Tac Tan-N", hex: "#C86941" },
  { name: "Lavang-N", hex: "#6E4B45" },
  { name: "Cherry Tan-N", hex: "#F2845F" },
  { name: "Winery-N", hex: "#754041" },
  { name: "Salsa", hex: "#D44F45" },
  { name: "Ash Bark-N", hex: "#716762" },
  { name: "Ketchup Red-N", hex: "#AA4D4F" },
  { name: "Fuchsia Fever-N", hex: "#B15675" },
  { name: "Air Breeze", hex: "#F1EDE8" },
  { name: "Lucid Dream", hex: "#E7D3D3" },
  { name: "Milkshake", hex: "#F9E4D1" },
  { name: "Lilac Frost", hex: "#ECE7E4" },
  { name: "Fresh Fuel", hex: "#E7DECF" },
  { name: "Thick Cream", hex: "#F4EED9" },
  { name: "White Gold", hex: "#E3E3DC" },
  { name: "Winter Nip", hex: "#E8EEDB" },
  { name: "Salt White", hex: "#F0EFEA" },
  { name: "Aqua Hint", hex: "#DFEDE6" },
  { name: "Fairytale", hex: "#DBE4E8" },
  { name: "High Spirits", hex: "#C7E2E7" },
  { name: "Lavender Secret", hex: "#E1DBE5" },
  { name: "Pale Blush", hex: "#F4E8E7" },
  { name: "Rose Essence", hex: "#ECBED9" },
  { name: "Catmint Blossom-N", hex: "#CAB1DA" },
  { name: "House of Windsor", hex: "#CFD4DE" },
  { name: "Morning Sky", hex: "#A8C4E2" },
  { name: "Dusky Iris", hex: "#D5DADC" },
  { name: "Costa Brava-N", hex: "#75C8E4" },
  { name: "Aqua Fusion", hex: "#A8E3DE" },
  { name: "Cucumber Cooler-N", hex: "#D5E8AA" },
  { name: "Pink Panther-N", hex: "#D786B0" },
  { name: "Wisteria Lane-N", hex: "#AD98C9" },
  { name: "Purple Robe", hex: "#6A7FB7" },
  { name: "Electric Azure-N", hex: "#55BADE" },
  { name: "Pangong Blue-N", hex: "#407EB6" },
  { name: "Ice Cabbage", hex: "#65BDA7" },
  { name: "Serene Cyan-N", hex: "#3BBFC2" },
  { name: "Green Tropics", hex: "#4B8883" },
  { name: "Ajrakh Blue-N", hex: "#008B95" },
  { name: "Habitat", hex: "#C4C499" },
  { name: "Cornichon-N", hex: "#7F9049" },
  { name: "Green Apple", hex: "#A5B75D" },
  { name: "Neón Verde-N", hex: "#C8CD3B" },
  { name: "Nimboo Splash-N", hex: "#EADB75" },
  { name: "Countryside", hex: "#C3B38B" },
  { name: "Lazy Daisy-N", hex: "#F1C83A" },
  { name: "Coffee Almond-N", hex: "#A8814A" },
  { name: "Orange Spark", hex: "#FEBA5E" },
  { name: "Deccan Earth-N", hex: "#D5825C" },
  { name: "Orange Silk", hex: "#F0A27C" },
  { name: "Aboli-N", hex: "#F4A094" },
  { name: "Ginger Pop", hex: "#C65C51" },
  { name: "Azalea", hex: "#EE91A8" },
  { name: "Dragonfruit Pink-N", hex: "#C9638A" },
  { name: "Young Wine", hex: "#DA727F" },
  { name: "Misty Mauve-N", hex: "#AE9CA3" },
  { name: "Pebble White", hex: "#F1E8D8" },
  { name: "Chalk Powder", hex: "#F0E9E0" },
  { name: "Royal Mauve", hex: "#5E506C" },
  { name: "Naval Club-N", hex: "#305B90" },
  { name: "Caspian Sea", hex: "#4C7390" },
  { name: "Elm Grove", hex: "#196A6D" },
  { name: "Malhaar-N", hex: "#87ACAA" },
  { name: "Green Sprouts", hex: "#668F74" },
  { name: "Spring Grass", hex: "#ADAE7C" },
  { name: "Gherkin Green-N", hex: "#937A36" },
  { name: "Pretzels-N", hex: "#A77548" },
  { name: "Marigold Garland-N", hex: "#FEBF69" },
  { name: "Rich Tan", hex: "#C97D41" },
  { name: "Nutmeg Sprinkle-N", hex: "#B6715A" },
  { name: "Litchi Skin-N", hex: "#C26555" },
  { name: "Guava Pink-N", hex: "#EE8486" },
];

interface Patch { id: number; x: number; y: number; color: string; }

const PATCH_MAX_SIZE = 200;

export default function WallPaintingV2Page() {
  const [resizedImage, setResizedImage] = useState<HTMLImageElement | null>(null);
  const [outputImageUrl, setOutputImageUrl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(NEW_COLORS[0].hex);
  const [patches, setPatches] = useState<Patch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Upload an image and select a color to begin.");
  const [isError, setIsError] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [starImage, setStarImage] = useState<HTMLImageElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);


  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setStarImage(img);
    img.src = '/images/star-patch.png';
  }, []);

  const resizeImage = (image: HTMLImageElement) => {
    const MAX_DIMENSION = 1024;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let { width, height } = image;
    setAspectRatio(width / height);
    if (width > height) {
      if (width > MAX_DIMENSION) { height = Math.round((height * MAX_DIMENSION) / width); width = MAX_DIMENSION; }
    } else {
      if (height > MAX_DIMENSION) { width = Math.round((width * MAX_DIMENSION) / height); height = MAX_DIMENSION; }
    }
    canvas.width = width; canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    const resizedImg = new Image();
    resizedImg.onload = () => setResizedImage(resizedImg);
    resizedImg.src = canvas.toDataURL('image/jpeg');
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => resizeImage(img);
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
      setOutputImageUrl(null); setPatches([]);
      setStatusMessage("Image loaded. Click on the image to add a color patch.");
      setIsError(false);
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !resizedImage) return;
    canvas.width = resizedImage.width; canvas.height = resizedImage.height;
    ctx.drawImage(resizedImage, 0, 0, canvas.width, canvas.height);
    if (!starImage || patches.length === 0) return;
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = PATCH_MAX_SIZE; offscreenCanvas.height = PATCH_MAX_SIZE;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return;
    for (const patch of patches) {
      offscreenCtx.clearRect(0, 0, PATCH_MAX_SIZE, PATCH_MAX_SIZE);
      offscreenCtx.drawImage(starImage, 0, 0, PATCH_MAX_SIZE, PATCH_MAX_SIZE);
      offscreenCtx.globalCompositeOperation = 'multiply';
      offscreenCtx.fillStyle = patch.color;
      offscreenCtx.fillRect(0, 0, PATCH_MAX_SIZE, PATCH_MAX_SIZE);
      offscreenCtx.globalCompositeOperation = 'destination-in';
      offscreenCtx.drawImage(starImage, 0, 0, PATCH_MAX_SIZE, PATCH_MAX_SIZE);
      offscreenCtx.globalCompositeOperation = 'source-over';
      ctx.drawImage(offscreenCanvas, patch.x - PATCH_MAX_SIZE / 2, patch.y - PATCH_MAX_SIZE / 2);
    }
  }, [resizedImage, patches, starImage]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);
  
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!resizedImage) return; const canvas = canvasRef.current; if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX; const y = (event.clientY - rect.top) * scaleY;
      if (patches.length < 5) { setPatches(prev => [...prev, { id: Date.now(), x, y, color: selectedColor }]); }
  };

  const undoLastPatch = () => { setPatches(prev => prev.slice(0, -1)); };
  const handleDownloadPatchedImage = () => { const canvas = canvasRef.current; if (!canvas) return; const link = document.createElement('a'); link.download = `patched-input-${Date.now()}.jpg`; link.href = canvas.toDataURL('image/jpeg'); link.click(); };
  
  const stopPolling = () => { if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; }};

  const handleCheckStatus = useCallback(async (currentJobId: string) => {
    if (!currentJobId) return;
    setLoadingStep(`Polling job: ${currentJobId.slice(0, 8)}...`);
    try {
      const response = await fetch('/api/wall-painting-v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'runpod_status', jobId: currentJobId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to fetch status.");
      
      switch (result.status) {
        case "COMPLETED":
          stopPolling();
          setLoadingProgress(100);
          const outputUrl = result.output?.data?.output_url;
          if (typeof outputUrl === 'string' && outputUrl.length > 0) {
            setOutputImageUrl(outputUrl.split('?')[0]);
            setStatusMessage(`✅ Job ${currentJobId.slice(0, 8)} Completed!`);
          } else {
            setStatusMessage(`⚠️ Job completed, but output URL is missing.`);
            setIsError(true);
          }
          setIsLoading(false);
          break;
        case "IN_PROGRESS":
        case "IN_QUEUE":
          setLoadingProgress(95);
          setStatusMessage(`⏳ Job is ${result.status.toLowerCase().replace('_', ' ')}...`);
          break;
        case "FAILED":
          stopPolling();
          setStatusMessage(`❌ Job failed. Error: ${result.error || 'Unknown error'}`);
          setIsLoading(false);
          setIsError(true);
          break;
      }
    } catch (error: any) {
      stopPolling();
      setStatusMessage(`❌ Error checking status: ${error.message}`);
      setIsError(true);
      setIsLoading(false);
    }
  }, []);

  const startPolling = (id: string) => {
    stopPolling();
    pollingIntervalRef.current = setInterval(() => handleCheckStatus(id), 3000);
  };

  const processImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) { setStatusMessage("Canvas not ready."); setIsError(true); return; }
    setIsLoading(true); setIsError(false); setOutputImageUrl(null); stopPolling(); setLoadingProgress(0);
    try {
      setLoadingStep("1/4: Preparing patched image..."); setLoadingProgress(10);
      const imageBlob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      if (!imageBlob) throw new Error("Could not generate image from canvas.");
      const patchedFile = new File([imageBlob], `patched_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      setLoadingStep("2/4: Requesting secure upload links..."); setLoadingProgress(30);
      const getSignedUrl = async (file: File): Promise<{ signedUrl: string, fileUrl: string }> => {
          const response = await fetch('/api/wall-painting-v2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getSignedUrl', fileName: file.name, fileType: file.type }), });
          if (!response.ok) { const error = await response.json(); throw new Error(error.error || "Failed to get signed URL.")};
          return response.json();
      };
      const [inputUrlData, outputUrlData] = await Promise.all([
          getSignedUrl(patchedFile),
          getSignedUrl(new File([], `output_${Date.now()}.jpg`, { type: 'image/jpeg' }))
      ]);
      
      setLoadingStep("3/4: Uploading patched image..."); setLoadingProgress(50);
      await fetch(inputUrlData.signedUrl, { method: 'PUT', headers: { 'Content-Type': patchedFile.type }, body: patchedFile });
      
      setLoadingStep("4/4: Dispatching job to AI Core..."); setLoadingProgress(75);
      const cleanInputUrl = inputUrlData.fileUrl.split('?')[0];
      const cleanOutputUrl = outputUrlData.signedUrl;
      
      const runpodResponse = await fetch('/api/wall-painting-v2', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
              action: 'runpod_run',
              data_from_frontend: {
                  img_url: cleanInputUrl,
                  output_signed_url: cleanOutputUrl 
              }
          }) 
      });

      const result = await runpodResponse.json();
      if (!runpodResponse.ok) throw new Error(result.error || "Runpod API request failed.");

      if (result.id) {
        setJobId(result.id);
        setStatusMessage(`🚀 Job submitted! ID: ${result.id.slice(0,8)}. Checking status...`);
        startPolling(result.id);
      } else {
        throw new Error("Did not receive a job ID from the server.");
      }
    } catch (error: any) {
      console.error(error);
      setStatusMessage(`❌ Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <AnimatePresence>
        {isFullscreen && fullscreenImageUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setIsFullscreen(false)}>
            <motion.img src={fullscreenImageUrl} alt="Fullscreen view" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20" onClick={() => setIsFullscreen(false)}><X className="w-6 h-6" /></Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
        <div className="relative z-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8"><Button asChild variant="ghost" className="text-gray-300 hover:bg-green-400/10 hover:text-green-400"><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link></Button></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent">Magic Wall Paint V2</h1><p className="mt-4 text-lg text-gray-300 max-w-3xl">Upload a photo, pick your colors, and click on the wall to add paint patches for the AI.</p></motion.div>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
                <Card className="bg-gray-900/60 border-transparent backdrop-blur-sm min-h-[500px] glowing-border-green glowing-border-green-active">
                    <CardHeader><CardTitle className="flex items-center text-green-400"><Paintbrush className="w-6 h-6 mr-3" />Controls</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <motion.div variants={{hidden: {opacity: 0, y:10}, visible:{opacity:1, y:0}}}>
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-semibold text-gray-300">1. Upload & Patch Image</label>
                                {resizedImage && (
                                    <Button variant="ghost" size="icon" className="w-7 h-7 text-gray-400 hover:text-white" title="View Fullscreen" onClick={() => {
                                        if (canvasRef.current) {
                                            setFullscreenImageUrl(canvasRef.current.toDataURL('image/jpeg'));
                                            setIsFullscreen(true);
                                        }
                                    }}>
                                        <Expand className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            <div 
                              className="glowing-border-green rounded-lg flex items-center justify-center text-center bg-black/20"
                              style={{ aspectRatio: resizedImage ? aspectRatio : 16/9 }}
                              onClick={() => !resizedImage && fileInputRef.current?.click()}
                            >
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                {resizedImage ? 
                                    <canvas ref={canvasRef} className="w-full h-full object-contain rounded-lg cursor-crosshair" onClick={handleCanvasClick} /> : 
                                    <div className="text-gray-400 p-4"><UploadCloud className="w-12 h-12 mx-auto" /><p>Click to upload (max 1024px)</p></div>
                                }
                            </div>
                        </motion.div>
                        <motion.div variants={{hidden: {opacity: 0, y:10}, visible:{opacity:1, y:0}}}>
                            <label className="font-semibold text-gray-300">2. Pick a Color</label>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full border-2 border-gray-500" style={{ backgroundColor: selectedColor }} />
                                <Select onValueChange={setSelectedColor} defaultValue={selectedColor}>
                                    <SelectTrigger className="w-full bg-gray-900 border-gray-700 focus:border-green-500 text-white"><SelectValue placeholder="Select a color" /></SelectTrigger>
                                    <SelectContent>
                                        {NEW_COLORS.map(color => (
                                            <SelectItem key={color.name} value={color.hex}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.hex }} />
                                                    {color.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </motion.div>
                         <motion.div variants={{hidden: {opacity: 0, y:10}, visible:{opacity:1, y:0}}} className="flex flex-wrap gap-4">
                            <Button className="flex-1 min-w-[200px] bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-base py-6" onClick={processImage} disabled={isLoading || !resizedImage || patches.length === 0}>
                                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}Generate
                            </Button>
                            <div className="flex-1 flex gap-4 min-w-[200px]">
                              <Button variant="outline" className="flex-1 text-base py-6" onClick={undoLastPatch} disabled={isLoading || patches.length === 0}><Undo2 className="w-5 h-5 mr-2"/>Undo</Button>
                              <Button variant="outline" className="flex-1 text-base py-6" onClick={handleDownloadPatchedImage} disabled={isLoading || !resizedImage || patches.length === 0}><Download className="w-5 h-5 mr-2"/>Input</Button>
                            </div>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gray-900/60 border-transparent backdrop-blur-sm min-h-[500px] glowing-border-green glowing-border-green-active">
                <CardHeader><CardTitle className="flex items-center text-green-400"><Sparkles className="w-6 h-6 mr-3" />Result</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <div 
                    className="w-full bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden p-2 relative group"
                    style={{ aspectRatio: resizedImage ? aspectRatio : 16/9 }}
                  >
                    {isLoading ? <div className="text-center text-gray-300 space-y-4"><Server className="w-12 h-12 text-green-400" /><p className="font-mono">{loadingStep}</p><div className="w-full bg-gray-700 h-2.5 rounded-full"><motion.div className="bg-gradient-to-r from-green-500 to-teal-500 h-2.5 rounded-full" initial={{width:'0%'}} animate={{width:`${loadingProgress}%`}}/></div><p className="font-mono text-green-400">{Math.round(loadingProgress)}%</p></div> : 
                      outputImageUrl ? (<> <motion.img src={outputImageUrl} alt="Generated map" className="w-full h-full object-contain rounded-md"/> <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/20" title="Download"><a href={outputImageUrl} download={`wall-paint-v2-${Date.now()}.jpg`}><Download className="w-5 h-5"/></a></Button><Button variant="ghost" size="icon" className="text-white hover:bg-white/20" title="Fullscreen" onClick={() => { setFullscreenImageUrl(outputImageUrl); setIsFullscreen(true); }}><Expand className="w-5 h-5"/></Button></div> </>) : 
                      <div className="text-center text-gray-500"><Palette className="w-16 h-16 mx-auto"/><p className="mt-4">Your result will appear here</p></div>}
                  </div>
                  <div className="mt-4 w-full p-4 rounded-lg bg-black/30 border border-gray-700">
                    <Badge variant={isError ? "destructive" : "secondary"} className={`mb-2 ${isError ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>{isError ? <XCircle className="w-4 h-4 mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}Status</Badge>
                    <p className={`text-sm ${isError ? 'text-red-300' : 'text-gray-300'} font-mono`}>{statusMessage}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}