"use client";

import { AnimatedBackground } from "@/components/ui/animated-background";
import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Sparkles, Loader2, CheckCircle2, XCircle, Download, Expand, X,
  Server, ArrowLeft, Layers, Settings, Move, Eye, EyeOff, Lock, Unlock,
  RefreshCcw, ZoomIn, ZoomOut, Maximize, Save, FileImage
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

type EditorLayer = {
  id: number;
  name: string;
  visible: boolean;
  locked: boolean;
  type: 'background' | 'foreground';
  image: HTMLImageElement | null;
  transform: { x: number; y: number; scale: number; rotation: number; };
};

const ImageEditor = ({ onProcess, isProcessing }: { onProcess: (composite: string) => void, isProcessing: boolean }) => {
  const [layers, setLayers] = useState<EditorLayer[]>([
    { id: 1, name: 'Background', visible: true, locked: true, type: 'background', image: null, transform: { x: 0, y: 0, scale: 1, rotation: 0 } },
    { id: 2, name: 'Foreground', visible: true, locked: false, type: 'foreground', image: null, transform: { x: 0, y: 0, scale: 1, rotation: 0 } }
  ]);
  const [activeLayerId, setActiveLayerId] = useState<number | null>(2);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLayer = layers.find(l => l.id === activeLayerId);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const container = containerRef.current;
    if (!ctx || !canvas || !container) return;
    const bgLayer = layers.find(l => l.type === 'background');
    if (bgLayer?.image) { canvas.width = bgLayer.image.width; canvas.height = bgLayer.image.height; }
    else { canvas.width = container.offsetWidth > 50 ? container.offsetWidth : 512; canvas.height = container.offsetHeight > 50 ? container.offsetHeight : 512; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layers.forEach(layer => { if (layer.image && layer.visible) { ctx.save(); const { x, y, scale, rotation } = layer.transform; const centerX = (canvas.width / 2) + x; const centerY = (canvas.height / 2) + y; ctx.translate(centerX, centerY); ctx.rotate((rotation * Math.PI) / 180); ctx.scale(scale, scale); ctx.drawImage(layer.image, -layer.image.width / 2, -layer.image.height / 2); ctx.restore(); } });
  }, [layers]);

  useEffect(() => { drawCanvas(); }, [layers, drawCanvas]);

  const handleImageUpload = (file: File, layerType: 'background' | 'foreground') => { const reader = new FileReader(); reader.onload = e => { const img = new Image(); img.onload = () => { setLayers(prev => prev.map(l => l.type === layerType ? { ...l, image: img } : l)); if (layerType === 'background') setActiveLayerId(2); }; img.src = e.target?.result as string; }; reader.readAsDataURL(file); };
  const handleTransformChange = (prop: 'x' | 'y' | 'scale' | 'rotation', value: number) => { setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, transform: { ...l.transform, [prop]: value } } : l)); };
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => { if (!activeLayer || activeLayer.locked) return; const rect = canvasRef.current!.getBoundingClientRect(); const x = (e.clientX - rect.left) / zoom; const y = (e.clientY - rect.top) / zoom; setIsDragging(true); setDragStart({ x: x - activeLayer.transform.x, y: y - activeLayer.transform.y }); };
  const handleMouseMove = useCallback((e: MouseEvent) => { if (!isDragging || !activeLayer || activeLayer.locked) return; const rect = canvasRef.current!.getBoundingClientRect(); const x = (e.clientX - rect.left) / zoom; const y = (e.clientY - rect.top) / zoom; handleTransformChange('x', x - dragStart.x); handleTransformChange('y', y - dragStart.y); }, [isDragging, activeLayer, dragStart, zoom]);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  useEffect(() => { if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); } return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; }, [isDragging, handleMouseMove, handleMouseUp]);

  const generateComposite = (): string | null => { const canvas = document.createElement('canvas'); const bgLayer = layers.find(l => l.type === 'background'); if (!bgLayer?.image) return null; canvas.width = bgLayer.image.width; canvas.height = bgLayer.image.height; const tempCtx = canvas.getContext('2d'); if (!tempCtx) return null; layers.forEach(layer => { if (layer.image && layer.visible) { tempCtx.save(); const { x, y, scale, rotation } = layer.transform; const centerX = (canvas.width / 2) + x; const centerY = (canvas.height / 2) + y; tempCtx.translate(centerX, centerY); tempCtx.rotate((rotation * Math.PI) / 180); tempCtx.scale(scale, scale); tempCtx.drawImage(layer.image, -layer.image.width / 2, -layer.image.height / 2); tempCtx.restore(); }}); return canvas.toDataURL('image/png').split(',')[1]; };
  const handleProcess = () => { const compositeBase64 = generateComposite(); if (compositeBase64) { onProcess(compositeBase64); } };

  return (
    <div className="flex w-full h-full bg-gray-900/50 rounded-lg border border-gray-700">
      <Card className="w-80 bg-gray-900/60 border-r border-gray-700 rounded-r-none flex flex-col">
        <CardHeader><CardTitle className="text-red-400">Tools & Layers</CardTitle></CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Tools</Label>
            <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <Button variant="outline" className="w-full justify-start bg-gray-800 border-red-500 text-white"><Move className="mr-2 h-4 w-4"/> Move Tool</Button>
            </TooltipTrigger><TooltipContent><p>Move the active layer</p></TooltipContent></Tooltip></TooltipProvider>
          </div>
          <Separator />
          <div className="space-y-2 flex-1">
            <Label className="text-gray-300">Layers</Label>
            {layers.map(layer => (
              <div key={layer.id} onClick={() => setActiveLayerId(layer.id)} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${activeLayerId === layer.id ? 'bg-red-500/20' : 'hover:bg-gray-700/50'}`}>
                <div className="flex items-center space-x-2"><button onClick={(e) => { e.stopPropagation(); setLayers(p => p.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l)); }} className="p-1 hover:bg-gray-600 rounded"><Eye size={16} className={layer.visible ? 'text-white' : 'text-gray-500'}/></button><span className="text-sm">{layer.name}</span></div>
                <button onClick={(e) => { e.stopPropagation(); setLayers(p => p.map(l => l.id === layer.id ? { ...l, locked: !l.locked } : l)); }} className="p-1 hover:bg-gray-600 rounded">{layer.locked ? <Lock size={16} className="text-red-400"/> : <Unlock size={16}/>}</button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="flex-1 flex flex-col bg-black">
        <div className="p-2 border-b border-gray-700 flex justify-between items-center">
          <div>
            <input type="file" id="bg-upload" className="hidden" onChange={e => e.target.files && handleImageUpload(e.target.files[0], 'background')} />
            <Button variant="ghost" className="text-gray-300" onClick={() => document.getElementById('bg-upload')?.click()}><Upload className="mr-2 h-4 w-4"/> Background</Button>
            <input type="file" id="fg-upload" className="hidden" onChange={e => e.target.files && handleImageUpload(e.target.files[0], 'foreground')} />
            <Button variant="ghost" className="text-gray-300" onClick={() => document.getElementById('fg-upload')?.click()}><Upload className="mr-2 h-4 w-4"/> Foreground</Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}><ZoomOut className="h-4 w-4"/></Button>
            <span className="text-sm font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(5, z + 0.1))}><ZoomIn className="h-4 w-4"/></Button>
            <Button variant="ghost" size="icon" onClick={() => setZoom(1)}><Maximize className="h-4 w-4"/></Button>
          </div>
        </div>
        <div ref={containerRef} className="flex-1 w-full h-full overflow-auto p-4 flex items-center justify-center bg-grid-pattern">
          <canvas ref={canvasRef} onMouseDown={handleMouseDown} style={{ transform: `scale(${zoom})`, cursor: isDragging ? 'grabbing' : 'grab', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }} className="transition-transform duration-100 ease-linear shadow-2xl bg-white/5" />
        </div>
      </div>
      <Card className="w-80 bg-gray-900/60 border-l border-gray-700 rounded-l-none flex flex-col">
        <CardHeader><CardTitle className="text-red-400">Properties & Actions</CardTitle></CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <Accordion type="multiple" defaultValue={['properties']} className="w-full">
            <AccordionItem value="properties">
              <AccordionTrigger className="text-white hover:no-underline">Transform Properties</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div><Label className="text-gray-300">Scale: {activeLayer?.transform.scale.toFixed(2)}x</Label><Slider value={[activeLayer?.transform.scale || 1]} onValueChange={v => handleTransformChange('scale', v[0])} min={0.1} max={3} step={0.05} disabled={!activeLayer || activeLayer.locked}/></div>
                <div><Label className="text-gray-300">Rotation: {activeLayer?.transform.rotation}°</Label><Slider value={[activeLayer?.transform.rotation || 0]} onValueChange={v => handleTransformChange('rotation', v[0])} min={-180} max={180} step={1} disabled={!activeLayer || activeLayer.locked}/></div>
                <div><Label className="text-gray-300">X Position: {activeLayer?.transform.x}px</Label><Slider value={[activeLayer?.transform.x || 0]} onValueChange={v => handleTransformChange('x', v[0])} min={-500} max={500} step={1} disabled={!activeLayer || activeLayer.locked}/></div>
                <div><Label className="text-gray-300">Y Position: {activeLayer?.transform.y}px</Label><Slider value={[activeLayer?.transform.y || 0]} onValueChange={v => handleTransformChange('y', v[0])} min={-500} max={500} step={1} disabled={!activeLayer || activeLayer.locked}/></div>
                <Button variant="outline" size="sm" onClick={() => setLayers(p => p.map(l => l.id === activeLayerId ? {...l, transform: {x:0, y:0, scale:1, rotation:0}} : l))} disabled={Boolean(!activeLayer || activeLayer.locked)}>Reset</Button>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="export">
              <AccordionTrigger className="text-white hover:no-underline">Export</AccordionTrigger>
              <AccordionContent className="space-y-2 pt-4">
                <Button variant="outline" className="w-full" onClick={() => {if (canvasRef.current) { const link = document.createElement('a'); link.download = 'composite-image.png'; link.href = canvasRef.current.toDataURL(); link.click(); }}}><FileImage className="mr-2 h-4 w-4"/> Export as PNG</Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="mt-auto pt-4">
            <Button onClick={handleProcess} disabled={isProcessing || !layers.find(l => l.type === 'background')?.image} className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 py-6 text-base">
              {isProcessing ? <RefreshCcw className="mr-2 h-5 w-5 animate-spin"/> : <Sparkles className="mr-2 h-5 w-5"/>}
              Process with AI
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function ImageCompositionPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Compose an image to get started.");
    const [isError, setIsError] = useState(false);
    const [outputImage, setOutputImage] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleProcessImage = async (compositeBase64: string) => {
        setIsLoading(true); setIsError(false); setOutputImage(null); setStatusMessage("Dispatching to AI Core...");
        try {
            const payload = { input: { image_data: compositeBase64 } };
            const response = await fetch('/api/image-composition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "API request failed.");
            
            console.log("Full API response received:", result);

            const status = result.status?.toLowerCase();
            if (status === 'success' || status === 'completed') {
                const b64 = result.output?.processed_image;
                if (b64 && typeof b64 === 'string') {
                    setOutputImage(`data:image/png;base64,${b64}`);
                    setStatusMessage("✅ AI Processing complete!");
                } else {
                    console.error("API response missing valid base64 string at 'output.processed_image':", result);
                    throw new Error("Processing succeeded, but image data was not returned in the expected format.");
                }
            } else {
                throw new Error(result.error || `Processing failed with status: ${status}`);
            }
        } catch (error: any) {
            console.error(error);
            setStatusMessage(`❌ Error: ${error.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AnimatedBackground />
            <AnimatePresence>
                {isFullscreen && outputImage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setIsFullscreen(false)}>
                        <motion.img src={outputImage} alt="Fullscreen result" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                        <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20" onClick={() => setIsFullscreen(false)}><X className="w-6 h-6" /></Button>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
                <div className="relative z-10 max-w-screen-2xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex justify-between items-center flex-shrink-0">
                        <div>
                            <Button asChild variant="ghost" className="text-gray-300 hover:bg-red-400/10 hover:text-red-400"><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link></Button>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent inline-block ml-4 align-middle">Image Composition Studio</h1>
                        </div>
                        <div className="w-1/3">
                            <Badge variant={isError ? "destructive" : "secondary"} className={`w-full justify-start p-2 ${isError ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isError ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                <span className="font-mono text-xs">{statusMessage}</span>
                            </Badge>
                        </div>
                    </motion.div>

                    <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                        <div className="col-span-9 h-full min-h-0">
                            <ImageEditor onProcess={handleProcessImage} isProcessing={isLoading} />
                        </div>
                        <div className="col-span-3 h-full">
                             <Card className="bg-gray-900/60 border-transparent backdrop-blur-sm h-full glowing-border-red glowing-border-red-active flex flex-col">
                                <CardHeader><CardTitle className="flex items-center text-red-400"><Sparkles className="w-6 h-6 mr-3" />AI-Generated Result</CardTitle></CardHeader>
                                <CardContent className="flex-1 flex flex-col items-center justify-center">
                                    <div className="w-full h-full bg-gray-800/50 rounded-lg flex items-center justify-center p-2 relative group">
                                        {isLoading && <Loader2 className="w-12 h-12 text-red-400 animate-spin" />}
                                        {!isLoading && outputImage && (
                                            <>
                                                <img src={outputImage} alt="AI Processed Result" className="w-full h-full object-contain rounded-md" />
                                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20"><a href={outputImage} download="ai-result.png"><Download className="h-4 w-4"/></a></Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsFullscreen(true)}><Expand className="h-4 w-4"/></Button>
                                                </div>
                                            </>
                                        )}
                                        {!isLoading && !outputImage && <div className="text-center text-gray-500">Your result will appear here.</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}