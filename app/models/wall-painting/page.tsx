"use client";

import { AnimatedBackground } from "@/components/ui/animated-background";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Palette,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ArrowLeft,
  Cpu,
  Paintbrush,
  Layers,
  Download,
  Expand,
  X,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const popularColors = {
  "Calm Tones": ["#B79054", "#77A55A", "#B3EBF2", "#BB91D8"],
  "Vibrant Hues": ["#FFC067", "#24BCBD", "#E388B6", "#FF746C"],
};

export default function WallPaintingPage() {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);
  const [outputImageUrl, setOutputImageUrl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#ECD663");
  const [jobId, setJobId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Upload an image and select a color to begin.");
  const [isError, setIsError] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { setInputFile(file); setOutputImageUrl(null); const reader = new FileReader(); reader.onloadend = () => { setInputImagePreview(reader.result as string); setStatusMessage("Image selected. Ready to process."); setIsError(false); }; reader.readAsDataURL(file); } };
  const cleanUrl = (url: string): string => url.split('?')[0];
  const getSignedUrl = async (file: File): Promise<{ signedUrl: string, fileUrl: string }> => { const fileName = `input_${Date.now()}.${file.name.split('.').pop()}`; const response = await fetch('/api/magic-paint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getSignedUrl', fileName, fileType: file.type }), }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || "Failed to get signed URL."); } return response.json(); };
  const uploadToGCS = async (signedUrl: string, file: File) => { const response = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file, }); if (!response.ok) throw new Error("Failed to upload image to storage."); };
  const processImage = async (isSync: boolean) => { if (!inputFile) { setStatusMessage("Please select an image first."); setIsError(true); return; } setIsLoading(true); setIsError(false); setOutputImageUrl(null); stopPolling(); setLoadingProgress(0); try { setLoadingStep("1/5: Requesting secure upload link..."); setLoadingProgress(10); const { signedUrl: inputSignedUrl, fileUrl: inputFileUrl } = await getSignedUrl(inputFile); setLoadingStep("2/5: Uploading image to cloud..."); setLoadingProgress(30); await uploadToGCS(inputSignedUrl, inputFile); const cleanInputUrl = cleanUrl(inputFileUrl); setLoadingStep("3/5: Preparing AI result slot..."); setLoadingProgress(50); const dummyOutputInfo = { name: `output_${Date.now()}.jpg`, type: "image/jpeg" }; const { signedUrl: outputSignedUrl } = await getSignedUrl(dummyOutputInfo as any); setLoadingStep("4/5: Dispatching job to AI Core..."); setLoadingProgress(70); const endpoint = isSync ? '/runsync' : '/run'; const payload = { input: { img_url: cleanInputUrl, output_signed_url: outputSignedUrl, color: selectedColor }, }; const runpodResponse = await fetch('/api/magic-paint', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'runpod', endpoint, payload }) }); const result = await runpodResponse.json(); if (!runpodResponse.ok) throw new Error(result.error || "Runpod API request failed."); setLoadingStep("5/5: Awaiting AI completion..."); setLoadingProgress(90); if (isSync) { if (result.status === "COMPLETED" && result.output?.output_url) { setLoadingProgress(100); setOutputImageUrl(cleanUrl(result.output.output_url)); setStatusMessage("✅ Success! Your wall has been repainted."); } else { throw new Error(result.error || "Sync processing did not complete successfully."); } } else { setJobId(result.id); setStatusMessage(`🚀 Job submitted! ID: ${result.id}. Checking status...`); startPolling(result.id); } } catch (error: any) { console.error(error); setStatusMessage(`❌ Error: ${error.message}`); setIsError(true); setIsLoading(false); setLoadingProgress(0); } finally { if(isSync) setIsLoading(false); } };
  const handleCheckStatus = useCallback(async (currentJobId: string) => { if (!currentJobId) return; setIsLoading(true); setLoadingStep(`Polling job: ${currentJobId}...`); try { const response = await fetch('/api/magic-paint', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'runpod_status', endpoint: `/status/${currentJobId}` }) }); const result = await response.json(); if(!response.ok) throw new Error(result.error || "Failed to fetch status."); switch (result.status) { case "COMPLETED": setLoadingProgress(100); if (result.output?.output_url) { setOutputImageUrl(cleanUrl(result.output.output_url)); setStatusMessage(`✅ Job ${currentJobId} Completed!`); } else { setStatusMessage(`⚠️ Job ${currentJobId} Completed, but output is missing.`); } setIsLoading(false); stopPolling(); break; case "IN_PROGRESS": case "IN_QUEUE": setLoadingProgress(95); setStatusMessage(`⏳ Job ${currentJobId} is ${result.status.toLowerCase().replace('_', ' ')}...`); if (!isPolling) startPolling(currentJobId); break; case "FAILED": setStatusMessage(`❌ Job ${currentJobId} failed. Error: ${result.error || 'Unknown error'}`); setIsLoading(false); stopPolling(); setIsError(true); setLoadingProgress(0); break; default: setStatusMessage(`❓ Unknown status for Job ${currentJobId}: ${result.status}`); if (!isPolling) startPolling(currentJobId); break; } } catch (error: any) { setStatusMessage(`❌ Error checking status: ${error.message}`); setIsError(true); setIsLoading(false); stopPolling(); setLoadingProgress(0); } }, [isPolling]);
  const stopPolling = () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; setIsPolling(false); };
  const startPolling = (currentJobId: string) => { stopPolling(); setIsPolling(true); pollingIntervalRef.current = setInterval(() => handleCheckStatus(currentJobId), 5000); };
  const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }, };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }, };

  return (
    <>
      <AnimatedBackground />
      <AnimatePresence>
        {isFullscreen && outputImageUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setIsFullscreen(false)}>
            <motion.img layoutId="result-image" src={outputImageUrl} alt="Fullscreen result" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20" onClick={() => setIsFullscreen(false)}><X className="w-6 h-6" /></Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
        <div className="relative z-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
              <Link href="/">
                <Button variant="ghost" className="text-gray-300 hover:bg-cyan-400/10 hover:text-cyan-400 flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Magic Wall Paint</h1><p className="mt-4 text-lg text-gray-300 max-w-3xl">Redesign your space in seconds. Upload a photo, pick a color, and let our AI show you the result.</p></motion.div>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <motion.div variants={cardVariants} initial="hidden" animate="visible">
                <Card className="bg-gray-900/60 border-transparent backdrop-blur-sm min-h-[500px] glowing-border glowing-border-active">
                    <CardHeader><CardTitle className="flex items-center text-cyan-400"><Palette className="w-6 h-6 mr-3" />Controls</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        <motion.div variants={itemVariants}><label className="font-semibold text-gray-300">1. Upload Image</label><div className="mt-2 h-64 glowing-border glowing-border-active rounded-lg flex items-center justify-center text-center cursor-pointer hover:bg-cyan-500/10 transition-colors" onClick={() => fileInputRef.current?.click()}><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />{inputImagePreview ? <img src={inputImagePreview} alt="Input preview" className="w-full h-full object-contain rounded-lg p-1"/> : <div className="text-gray-400"><UploadCloud className="w-12 h-12 mx-auto" /><p>Click or drag the image of the wall to upload</p></div>}</div></motion.div>
                        <motion.div variants={itemVariants}><label className="font-semibold text-gray-300">2. Pick a Color</label><div className="mt-2 flex items-center gap-4"><div className="w-12 h-12 rounded-full border-2 border-gray-500" style={{ backgroundColor: selectedColor }} /><div className="flex-1 space-y-2">{Object.entries(popularColors).map(([groupName, colors]) => (<div key={groupName} className="flex gap-2">{colors.map(hex => (<motion.button key={hex} whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }} onClick={() => setSelectedColor(hex)} className={`w-full h-8 rounded-md border-2 ${selectedColor === hex ? 'border-cyan-400 ring-2 ring-cyan-400' : 'border-gray-600'}`} style={{ backgroundColor: hex }} />))}</div>))}</div></div></motion.div>
                        <motion.div variants={itemVariants}>
                            <label className="font-semibold text-gray-300">3. Process</label>
                            <div className="mt-2 space-y-4">
                                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-base py-6" onClick={() => processImage(true)} disabled={isLoading || !inputFile}>
                                    <span className="flex items-center justify-center">
                                        {isLoading && !isPolling ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                        Process Now (Sync)
                                    </span>
                                </Button>
                                <Card className="bg-gray-800/60 border-gray-700 p-4">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Button className="flex-1" variant="secondary" onClick={() => processImage(false)} disabled={isLoading || !inputFile}>
                                            <span className="flex items-center justify-center">
                                                <Clock className="w-4 h-4 mr-2" />Process Later (Async)
                                            </span>
                                        </Button>
                                        <div className="flex flex-1 items-center gap-2">
                                            <Input 
                                                placeholder="Enter Job ID" 
                                                value={jobId} 
                                                onChange={(e) => setJobId(e.target.value)} 
                                                className="bg-gray-900 border-gray-600 focus:border-cyan-500 text-white placeholder:text-gray-500 font-mono"
                                            />
                                            <Button size="icon" onClick={() => handleCheckStatus(jobId)} disabled={isLoading || !jobId}>
                                                <Search className="w-4 h-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                    {isPolling && <Button size="sm" variant="destructive" className="w-full mt-3" onClick={stopPolling}>Stop Checking</Button>}
                                </Card>
                            </div>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gray-900/60 border-transparent backdrop-blur-sm min-h-[500px] glowing-border glowing-border-active">
                <CardHeader><CardTitle className="flex items-center text-cyan-400"><Sparkles className="w-6 h-6 mr-3" />Result</CardTitle></CardHeader>
                <CardContent className="flex flex-col items-center justify-center h-full">
                  <div className="w-full h-80 bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden p-2 relative group">
                      <AnimatePresence>
                        {isLoading && ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-300 space-y-4 w-full p-4"> <Server className="w-12 h-12 text-cyan-400" /> <p className="font-mono text-lg">{loadingStep}</p> <div className="w-full bg-gray-700 rounded-full h-2.5"> <motion.div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full" initial={{ width: '0%' }} animate={{ width: `${loadingProgress}%` }} transition={{ duration: 0.5, ease: "easeInOut" }} /> </div> <p className="font-mono text-cyan-400">{Math.round(loadingProgress)}%</p> </motion.div> )}
                      </AnimatePresence>
                      {!isLoading && outputImageUrl && ( <> <motion.img layoutId="result-image" src={outputImageUrl} alt="Processed result" className="w-full h-full object-contain rounded-md"/> <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"> <a href={outputImageUrl} download={`painted-wall-${Date.now()}.jpg`}><Button variant="ghost" size="icon" className="text-white hover:bg-white/20" title="Download Image"><Download className="w-5 h-5" /></Button></a> <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" title="View Fullscreen" onClick={() => setIsFullscreen(true)}> <Expand className="w-5 h-5" /> </Button> </div> </> )}
                      {!isLoading && !outputImageUrl && <div className="text-center text-gray-500"><Palette className="w-16 h-16 mx-auto"/><p className="mt-4">Your result will appear here</p></div>}
                  </div>
                  <div className="mt-4 w-full p-4 rounded-lg bg-black/30 border border-gray-700">
                    {/* ===== FINAL FIX APPLIED HERE ===== */}
                    <Badge variant={isError ? "destructive" : "secondary"} className={`mb-2 ${isError ? 'bg-red-900/50 text-red-300' : 'bg-blue-900/50 text-blue-300'}`}>
                        <span className="flex items-center gap-1">
                            {isError ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            Status
                        </span>
                    </Badge>
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