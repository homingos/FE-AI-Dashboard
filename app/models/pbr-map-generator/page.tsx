"use client";

import { AnimatedBackground } from "@/components/ui/animated-background";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Expand,
  X,
  Server,
  Layers,
  Gauge,
  Gem,
  Waves,
  MapPin,
  Package,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JSZip from 'jszip'; // <--- Step 1: Import JSZip

// Helper component
const MapButton = ({ mapType, icon, label, onClick, disabled }: { mapType: any, icon: React.ReactNode, label: string, onClick: (type: any) => void, disabled: boolean }) => (
    <Button variant="secondary" className="w-full justify-start" onClick={() => onClick(mapType)} disabled={disabled}>
        {icon}{label}
    </Button>
);

export default function PBRMapPage() {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);
  const [outputImageUrl, setOutputImageUrl] = useState<string | null>(null);
  const [outputGridUrl, setOutputGridUrl] = useState<string | null>(null);
  const [outputZipUrl, setOutputZipUrl] = useState<string | null>(null);
  const [denoiseSteps, setDenoiseSteps] = useState(4);
  const [ensembleSize, setEnsembleSize] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Upload an image to generate PBR maps.");
  const [isError, setIsError] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const [activeTab, setActiveTab] = useState("individual");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setInputImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setStatusMessage("Image selected. Adjust parameters and generate.");
      setIsError(false);
      setOutputImageUrl(null);
      setOutputGridUrl(null);
      setOutputZipUrl(null);
    }
  };

  // ==================== NEW HELPER FUNCTIONS START ====================
  const createDataUrl = (base64String: string, type = 'image/png') => {
    if (base64String.startsWith('data:')) return base64String;
    return `data:${type};base64,${base64String}`;
  };

  const generateGridInBrowser = async (base64Outputs: Record<string, string>, originalImage: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve("");

      const mapsToDraw = [
        { label: 'Albedo', data: base64Outputs.albedo_path_base64 },
        { label: 'Normals', data: base64Outputs.normals_path_base64 },
        { label: 'Roughness', data: base64Outputs.roughness_path_base64 },
        { label: 'Metalness', data: base64Outputs.metalness_path_base64 },
        { label: 'Depth', data: base64Outputs.depth_path_base64 },
        { label: 'Original', data: originalImage.split(',')[1] } // Use original uploaded image
      ];
      
      const images: HTMLImageElement[] = [];
      let loadedCount = 0;

      mapsToDraw.forEach(mapInfo => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === mapsToDraw.length) {
            // All images loaded, now draw the grid
            const w = images[0].width;
            const h = images[0].height;
            const padding = 20; // More padding for labels
            const labelHeight = 40;
            const cols = 3;
            const rows = 2;
            
            canvas.width = cols * w + (cols - 1) * padding;
            canvas.height = rows * (h + labelHeight) + (rows - 1) * padding;

            ctx.fillStyle = '#111827'; // Dark background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            images.forEach((loadedImg, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const x = col * (w + padding);
              const y = row * (h + labelHeight + padding);
              
              ctx.drawImage(loadedImg, x, y, w, h);

              // Draw label
              ctx.fillStyle = '#374151'; // Label background
              ctx.fillRect(x, y + h, w, labelHeight);
              ctx.fillStyle = 'white';
              ctx.font = '16px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(mapsToDraw[i].label, x + w / 2, y + h + labelHeight / 2);
            });
            resolve(canvas.toDataURL('image/png'));
          }
        };
        img.src = createDataUrl(mapInfo.data);
        images.push(img);
      });
    });
  };

  const generateZipInBrowser = async (base64Outputs: Record<string, string>): Promise<string> => {
    const zip = new JSZip();
    const mapKeys = ['albedo', 'normals', 'roughness', 'metalness', 'depth', 'depth_16bit'];

    for (const key of mapKeys) {
      const b64_key = `${key}_path_base64`;
      if (base64Outputs[b64_key]) {
        zip.file(`${key}.png`, base64Outputs[b64_key], { base64: true });
      }
    }
    
    const content = await zip.generateAsync({ type: 'base64' });
    return createDataUrl(content, 'application/zip');
  };
  // ===================== NEW HELPER FUNCTIONS END =====================

  const processMap = async (mapType: 'albedo' | 'normals' | 'roughness' | 'metalness' | 'depth' | 'all') => {
    if (!inputFile || !inputImagePreview) { 
      setStatusMessage("Please select an image first."); 
      setIsError(true); 
      return; 
    }
    
    setIsLoading(true); 
    setIsError(false); 
    setOutputImageUrl(null); 
    setOutputGridUrl(null); 
    setOutputZipUrl(null); 
    setLoadingProgress(0);
    
    try {
      setLoadingStep("1/3: Preparing secure upload..."); 
      setLoadingProgress(10);
      
      const getSignedUrl = async (file: File): Promise<{ signedUrl: string, fileUrl: string }> => { 
        const fileName = `upload_${Date.now()}.${file.name.split('.').pop()}`; 
        const response = await fetch('/api/pbr-map-generator', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ action: 'getSignedUrl', fileName, fileType: file.type }), 
        }); 
        if (!response.ok) { 
          const errorData = await response.json(); 
          throw new Error(errorData.error || "Failed to get signed URL."); 
        } 
        return response.json(); 
      };
      
      const { signedUrl: inputSignedUrl, fileUrl: inputFileUrl } = await getSignedUrl(inputFile);
      
      setLoadingStep("2/3: Uploading image..."); 
      setLoadingProgress(40);
      
      const uploadToGCS = async (signedUrl: string, file: File) => { 
        const response = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file }); 
        if (!response.ok) throw new Error("Failed to upload image to storage."); 
      };
      
      await uploadToGCS(inputSignedUrl, inputFile);
      const imageUrlForApi = inputFileUrl.split('?')[0];
      
      setLoadingStep("3/3: Dispatching job to AI Core..."); 
      setLoadingProgress(75);
      
      const payload = { input: { endpoint: mapType, image_url: imageUrlForApi, parameters: { denoise_steps: denoiseSteps, ensemble_size: ensembleSize } } };
      
      const runpodResponse = await fetch('/api/pbr-map-generator', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'runpod', endpoint: '/runsync', payload }) });
      
      const result = await runpodResponse.json();
      
      if (!runpodResponse.ok) {
        throw new Error(result.error || "Runpod API request failed.");
      }
      
      console.log("Full API response:", result);
      
      const responseStatus = result.status?.toLowerCase();
      if (responseStatus === "completed" || responseStatus === "success") {
        setLoadingProgress(90); // AI work is done, now frontend processing
        setStatusMessage(`✅ AI processing complete. Preparing downloads...`);
        
        const outputData = result.output?.result;
        
        if (outputData) {
          console.log("Received successful output data:", outputData);
          
          if (mapType === 'all') {
            const base64Outputs = outputData.base64_outputs;
            if (!base64Outputs) throw new Error("API response for 'all' maps is missing the 'base64_outputs' object.");

            // Generate grid and zip file in the browser
            const [gridDataUrl, zipDataUrl] = await Promise.all([
              generateGridInBrowser(base64Outputs, inputImagePreview),
              generateZipInBrowser(base64Outputs)
            ]);

            setOutputGridUrl(gridDataUrl);
            setOutputZipUrl(zipDataUrl);
            setActiveTab("all");
          } else {
            // Handle individual map requests
            let imageB64 = outputData.output_path_base64; // Prefer direct key
            if (!imageB64 && outputData.base64_outputs) { // Fallback to nested key
                const specificKey = `${mapType}_path_base64`;
                imageB64 = outputData.base64_outputs[specificKey];
            }

            if (imageB64) {
                setOutputImageUrl(createDataUrl(imageB64));
            } else {
                throw new Error(`Could not find base64 image data for map type '${mapType}'.`);
            }
            setActiveTab("individual");
          }
          setStatusMessage(`✅ Success! ${mapType.charAt(0).toUpperCase() + mapType.slice(1)} map(s) ready.`);
          setLoadingProgress(100);
        } else {
          throw new Error("Processing completed, but no output data was found.");
        }
      } else {
        throw new Error(result.error?.detail || result.error || `Processing failed with status: ${result.status}`);
      }
    } catch (error: any) {
      console.error("Error in processMap:", error);
      setStatusMessage(`❌ Error: ${error.message}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // The rest of your component's return statement remains unchanged.
  return (
    <>
      <AnimatedBackground />
      <AnimatePresence>
        {isFullscreen && fullscreenImageUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setIsFullscreen(false)}>
            <motion.img src={fullscreenImageUrl} alt="Fullscreen result" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20" onClick={() => setIsFullscreen(false)}><X className="w-6 h-6" /></Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
        <div className="relative z-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8"><Button asChild variant="ghost" className="text-gray-300 hover:bg-green-400/10 hover:text-green-400"><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link></Button></motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent">PBR Map Generator</h1><p className="mt-4 text-lg text-gray-300 max-w-3xl">Create physically-based rendering maps from any image for your 3D assets.</p></motion.div>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
                <Card className="bg-gray-900/60 border-transparent backdrop-blur-sm min-h-[500px] glowing-border-green glowing-border-green-active">
                    <CardHeader><CardTitle className="flex items-center text-green-400"><Layers className="w-6 h-6 mr-3" />Controls</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <motion.div variants={{hidden: {opacity: 0, y:10}, visible:{opacity:1, y:0}}}><label className="font-semibold text-gray-300">1. Upload Image</label><div className="mt-2 h-48 glowing-border-green glowing-border-green-active rounded-lg flex items-center justify-center text-center cursor-pointer hover:bg-green-500/10 transition-colors" onClick={() => fileInputRef.current?.click()}><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />{inputImagePreview ? <img src={inputImagePreview} alt="Input preview" className="w-full h-full object-contain rounded-lg p-1"/> : <div className="text-gray-400"><UploadCloud className="w-12 h-12 mx-auto" /><p>Click or drag file to upload</p></div>}</div></motion.div>
                        <motion.div variants={{hidden: {opacity: 0, y:10}, visible:{opacity:1, y:0}}}><label className="font-semibold text-gray-300">2. Parameters</label><div className="space-y-4 mt-2"><div className="grid gap-2"><div className="flex justify-between items-center"><label htmlFor="denoise" className="text-sm text-gray-400">Denoise Steps</label><span className="text-sm font-mono text-green-400">{denoiseSteps}</span></div><Slider id="denoise" defaultValue={[4]} value={[denoiseSteps]} onValueChange={(val) => setDenoiseSteps(val[0])} max={10} step={1} /></div><div className="grid gap-2"><div className="flex justify-between items-center"><label htmlFor="ensemble" className="text-sm text-gray-400">Ensemble Size</label><span className="text-sm font-mono text-green-400">{ensembleSize}</span></div><Slider id="ensemble" defaultValue={[1]} value={[ensembleSize]} onValueChange={(val) => setEnsembleSize(val[0])} max={10} step={1} /></div></div></motion.div>
                        <motion.div variants={{hidden: {opacity: 0, y:10}, visible:{opacity:1, y:0}}}><label className="font-semibold text-gray-300">3. Generate</label><div className="mt-2 space-y-2"><div className="grid grid-cols-2 gap-2"><MapButton mapType="albedo" icon={<MapPin className="w-4 h-4 mr-2" />} label="Albedo Map" onClick={processMap} disabled={isLoading || !inputFile} /><MapButton mapType="normals" icon={<Waves className="w-4 h-4 mr-2" />} label="Normal Map" onClick={processMap} disabled={isLoading || !inputFile} /><MapButton mapType="roughness" icon={<Gauge className="w-4 h-4 mr-2" />} label="Roughness Map" onClick={processMap} disabled={isLoading || !inputFile} /><MapButton mapType="metalness" icon={<Gem className="w-4 h-4 mr-2" />} label="Metalness Map" onClick={processMap} disabled={isLoading || !inputFile} /><MapButton mapType="depth" icon={<Layers className="w-4 h-4 mr-2" />} label="Depth Map" onClick={processMap} disabled={isLoading || !inputFile} /></div><Button className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-base py-6 mt-2" onClick={() => processMap('all')} disabled={isLoading || !inputFile}>{isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Package className="w-5 h-5 mr-2" />}Generate All Maps</Button></div></motion.div>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gray-900/60 border-transparent backdrop-blur-sm min-h-[500px] glowing-border-green glowing-border-green-active">
                <CardHeader><CardTitle className="flex items-center text-green-400"><Sparkles className="w-6 h-6 mr-3" />Result</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="individual">Individual Map</TabsTrigger><TabsTrigger value="all">All Maps</TabsTrigger></TabsList>
                    <TabsContent value="individual">
                      <div className="w-full h-80 mt-2 bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden p-2 relative group">
                        {isLoading ? <div className="text-center text-gray-300 space-y-4"><Server className="w-12 h-12 text-green-400" /><p className="font-mono">{loadingStep}</p><div className="w-full bg-gray-700 h-2.5 rounded-full"><motion.div className="bg-gradient-to-r from-green-500 to-teal-500 h-2.5 rounded-full" initial={{width:'0%'}} animate={{width:`${loadingProgress}%`}}/></div><p className="font-mono text-green-400">{Math.round(loadingProgress)}%</p></div> : 
                          outputImageUrl ? (<> <motion.img src={outputImageUrl} alt="Generated map" className="w-full h-full object-contain rounded-md"/> <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/20" title="Download"><a href={outputImageUrl} download={`pbr-map-${Date.now()}.png`}><Download className="w-5 h-5"/></a></Button><Button variant="ghost" size="icon" className="text-white hover:bg-white/20" title="Fullscreen" onClick={() => { setFullscreenImageUrl(outputImageUrl); setIsFullscreen(true); }}><Expand className="w-5 h-5"/></Button></div> </>) : 
                          <div className="text-center text-gray-500"><Layers className="w-16 h-16 mx-auto"/><p className="mt-4">Your generated map will appear here</p></div>}
                      </div>
                    </TabsContent>
                    <TabsContent value="all">
                      <div className="w-full h-80 mt-2 bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden p-2 relative group">
                        {isLoading ? <div className="text-center text-gray-300 space-y-4"><Server className="w-12 h-12 text-green-400" /><p className="font-mono">{loadingStep}</p><div className="w-full bg-gray-700 h-2.5 rounded-full"><motion.div className="bg-gradient-to-r from-green-500 to-teal-500 h-2.5 rounded-full" initial={{width:'0%'}} animate={{width:`${loadingProgress}%`}}/></div><p className="font-mono text-green-400">{Math.round(loadingProgress)}%</p></div> :
                          outputGridUrl ? (<> <motion.img src={outputGridUrl} alt="All maps grid" className="w-full h-full object-contain rounded-md"/> <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/20" title="Download Grid"><a href={outputGridUrl} download={`pbr-grid-${Date.now()}.png`}><Download className="w-5 h-5"/></a></Button><Button variant="ghost" size="icon" className="text-white hover:bg-white/20" title="Fullscreen" onClick={() => { setFullscreenImageUrl(outputGridUrl); setIsFullscreen(true); }}><Expand className="w-5 h-5"/></Button></div> </>) : 
                          <div className="text-center text-gray-500"><Package className="w-16 h-16 mx-auto"/><p className="mt-4">The map grid and ZIP file will be available here</p></div>}
                      </div>
                    </TabsContent>
                  </Tabs>
                  <div className="mt-4 w-full">
                    {outputZipUrl && !isLoading && (
                      <Button asChild className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">
                        <a href={outputZipUrl} download={`pbr-maps-${Date.now()}.zip`}><Download className="w-5 h-5 mr-2" /> Download All Maps (.zip)</a>
                      </Button>
                    )}
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