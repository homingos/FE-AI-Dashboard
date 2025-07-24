"use client";

import { AnimatedBackground } from "@/components/ui/animated-background";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
// --- MODIFIED: Added new icons for the new features ---
import { UploadCloud, Sparkles, Loader2, CheckCircle2, XCircle, Download, Expand, X, Server, ArrowLeft, Shirt, PersonStanding } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Helper component for the dual image uploaders
const ImageUploader = ({ title, onFileChange, previewUrl, icon }: { title: string, onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, previewUrl: string | null, icon: React.ReactNode }) => {
    const uploaderRef = useRef<HTMLInputElement>(null);
    return (
        <div>
            <label className="font-semibold text-gray-300">{title}</label>
            <div className="mt-2 h-64 glowing-border-red glowing-border-red-active rounded-lg flex items-center justify-center text-center cursor-pointer hover:bg-red-500/10 transition-colors" onClick={() => uploaderRef.current?.click()}>
                <input ref={uploaderRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg p-1"/> : <div className="text-gray-400">{icon}<p>Click or drag file</p></div>}
            </div>
        </div>
    );
};

// Helper component for rendering example grids
const ExampleGrid = ({ examples, onSelect }: { examples: { path: string, name?: string }[], onSelect: (path: string) => void }) => (
    <div className="grid grid-cols-4 gap-2 mt-2">
        {examples.map((example, index) => (
            <motion.div key={index} className="aspect-w-3 aspect-h-4 cursor-pointer rounded-md overflow-hidden border-2 border-transparent hover:border-red-500" onClick={() => onSelect(example.path)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <img src={example.path} alt={example.name || `Example ${index + 1}`} className="object-cover w-full h-full" />
            </motion.div>
        ))}
    </div>
);

export default function ClothesSwapperPage() {
    const [humanExamples, setHumanExamples] = useState<{ path: string }[]>([]);
    const [garmentExamples, setGarmentExamples] = useState<{ path: string; description: string }[]>([]);
    
    const [humanFile, setHumanFile] = useState<File | null>(null);
    const [humanPreview, setHumanPreview] = useState<string | null>(null);
    const [garmentFile, setGarmentFile] = useState<File | null>(null);
    const [garmentPreview, setGarmentPreview] = useState<string | null>(null);
    const [garmentDescription, setGarmentDescription] = useState("");
    const [useAutoMask, setUseAutoMask] = useState(true);
    const [useAutoCrop, setUseAutoCrop] = useState(false);
    const [denoiseSteps, setDenoiseSteps] = useState(30);
    const [seed, setSeed] = useState(42);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [maskImage, setMaskImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Upload images or select an example to begin.");
    const [isError, setIsError] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStep, setLoadingStep] = useState("");
    
    // --- NEW: State for fullscreen image modal ---
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchExamples = async () => {
            try {
                const response = await fetch('/api/list-examples');
                if (!response.ok) throw new Error('Failed to fetch examples from server.');
                const data = await response.json();
                setHumanExamples(data.humanExamples || []);
                setGarmentExamples(data.garmentExamples || []);
            } catch (error) {
                console.error("Could not load example images:", error);
                setStatusMessage("⚠️ Could not load example images.");
            }
        };
        fetchExamples();
    }, []);

    const handleExampleSelect = async (path: string, type: 'human' | 'garment') => {
        try {
            const response = await fetch(path);
            const blob = await response.blob();
            const fileName = path.split('/').pop() || 'example.png';
            const file = new File([blob], fileName, { type: blob.type });

            if (type === 'human') {
                handleFileChange(file, setHumanFile, setHumanPreview);
            } else {
                handleFileChange(file, setGarmentFile, setGarmentPreview);
                const garmentData = garmentExamples.find(g => g.path === path);
                if (garmentData?.description) setGarmentDescription(garmentData.description);
            }
        } catch (error) {
            console.error("Error loading example image:", error);
            setStatusMessage("❌ Failed to load example image.");
            setIsError(true);
        }
    };

    const handleFileChange = (file: File | null, setFile: Function, setPreview: Function) => {
        if (file) {
            setFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const processTryOn = async () => {
        if (!humanFile || !garmentFile) { setStatusMessage("Please upload both a human and a garment image."); setIsError(true); return; }
        setIsLoading(true); setIsError(false); setResultImage(null); setMaskImage(null); setLoadingProgress(0);
        try {
            const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });

            setLoadingStep("1/2: Encoding images..."); setLoadingProgress(35);
            const humanBase64 = await fileToBase64(humanFile);
            setLoadingProgress(50);
            const garmentBase64 = await fileToBase64(garmentFile);

            setLoadingStep("2/2: Dispatching job to AI Core..."); setLoadingProgress(75);
            const payload = { input: { human_img: humanBase64, garm_img: garmentBase64, garment_des: garmentDescription, is_checked: useAutoMask, is_checked_crop: useAutoCrop, denoise_steps: denoiseSteps, seed: seed } };
            const runpodResponse = await fetch('/api/clothes-swapper', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload }), });
            const result = await runpodResponse.json();
            if (!runpodResponse.ok) throw new Error(result.error || "Runpod API request failed.");
            
            setLoadingStep("Receiving results..."); setLoadingProgress(90);
            const responseStatus = result.status?.toLowerCase();
            if (responseStatus === "completed" || responseStatus === "success") {
                setLoadingProgress(100);
                setStatusMessage("✅ Success! Virtual try-on complete.");
                const outputData = result.output;
                console.log("Received API output:", outputData);

                if (outputData) {
                    const createDataUrl = (base64: string) => `data:image/png;base64,${base64}`;
                    const finalImageB64 = outputData.result_image_base64 || outputData.image_base64 || outputData.output;
                    const maskImageB64 = outputData.mask_image_base64;
                    if (finalImageB64) setResultImage(createDataUrl(finalImageB64));
                    if (maskImageB64) setMaskImage(createDataUrl(maskImageB64));
                } else { setStatusMessage("⚠️ Processing succeeded, but output data is missing."); }
            } else { throw new Error(result.error || `Processing failed with status: ${result.status}`); }
        } catch (error: any) {
            console.error(error);
            setStatusMessage(`❌ Error: ${error.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
            setLoadingProgress(0);
        }
    };

    return (
        <>
            <AnimatedBackground />
            {/* --- NEW: Fullscreen image modal --- */}
            <AnimatePresence>
                {isFullscreen && fullscreenImageUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsFullscreen(false)}
                    >
                        <motion.img
                            src={fullscreenImageUrl}
                            alt="Fullscreen result"
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20"
                            onClick={() => setIsFullscreen(false)}
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
                <div className="relative z-10 max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8"><Button asChild variant="ghost" className="text-gray-300 hover:bg-red-400/10 hover:text-red-400"><Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link></Button></motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Virtual Try-On</h1><p className="mt-4 text-lg text-gray-300 max-w-3xl">See how clothes look on different models without a physical fitting.</p></motion.div>
                    <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
                            <Card className="bg-gray-900/60 border-transparent backdrop-blur-sm glowing-border-red glowing-border-red-active">
                                <CardHeader><CardTitle className="flex items-center text-red-400"><Shirt className="w-6 h-6 mr-3" />Controls</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <motion.div variants={{hidden:{opacity:0, y:10}, visible:{opacity:1,y:0}}}>
                                        <div className="grid grid-cols-2 gap-4">
                                            <ImageUploader title="1. Human Model" onFileChange={(e) => handleFileChange(e.target.files?.[0] || null, setHumanFile, setHumanPreview)} previewUrl={humanPreview} icon={<PersonStanding className="w-12 h-12 mx-auto text-gray-400"/>} />
                                            <ImageUploader title="2. Garment" onFileChange={(e) => handleFileChange(e.target.files?.[0] || null, setGarmentFile, setGarmentPreview)} previewUrl={garmentPreview} icon={<Shirt className="w-12 h-12 mx-auto text-gray-400"/>} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            {humanExamples.length > 0 ? ( <ExampleGrid examples={humanExamples} onSelect={(path) => handleExampleSelect(path, 'human')} /> ) : <div className="col-span-1 text-xs text-center text-gray-500">Loading...</div>}
                                            {garmentExamples.length > 0 ? ( <ExampleGrid examples={garmentExamples} onSelect={(path) => handleExampleSelect(path, 'garment')} /> ) : <div className="col-span-1 text-xs text-center text-gray-500">Loading...</div>}
                                        </div>
                                    </motion.div>
                                    <motion.div variants={{hidden:{opacity:0, y:10}, visible:{opacity:1,y:0}}}> <Label htmlFor="description" className="font-semibold text-gray-300">3. Garment Description</Label> <Textarea id="description" value={garmentDescription} onChange={(e) => setGarmentDescription(e.target.value)} className="mt-2 bg-gray-900 border-gray-700 focus:border-red-500 text-white" placeholder="e.g., a red t-shirt with a logo" /> </motion.div>
                                    <motion.div variants={{hidden:{opacity:0, y:10}, visible:{opacity:1,y:0}}} className="space-y-4"> <Label className="font-semibold text-gray-300">4. Advanced Settings</Label> <div className="flex items-center space-x-2 pt-2"><Checkbox id="auto-mask" checked={useAutoMask} onCheckedChange={(checked) => setUseAutoMask(Boolean(checked))} /><Label htmlFor="auto-mask" className="text-sm font-medium text-gray-300">Use auto-generated mask</Label></div> <div className="flex items-center space-x-2"><Checkbox id="auto-crop" checked={useAutoCrop} onCheckedChange={(checked) => setUseAutoCrop(Boolean(checked))} /><Label htmlFor="auto-crop" className="text-sm font-medium text-gray-300">Use auto-crop & resizing</Label></div> <div className="grid gap-2"><div className="flex justify-between items-center"><Label htmlFor="denoise" className="text-sm text-gray-300">Denoise Steps</Label><span className="font-mono text-red-400">{denoiseSteps}</span></div><Input id="denoise" type="number" value={denoiseSteps} onChange={(e) => setDenoiseSteps(Number(e.target.value))} className="bg-gray-900 border-gray-700 text-white"/></div> <div className="grid gap-2"><div className="flex justify-between items-center"><Label htmlFor="seed" className="text-sm text-gray-300">Seed</Label><span className="font-mono text-red-400">{seed}</span></div><Input id="seed" type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} className="bg-gray-900 border-gray-700 text-white" /></div> </motion.div>
                                    <motion.div variants={{hidden:{opacity:0, y:10}, visible:{opacity:1,y:0}}}> <Button className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white text-base py-6" onClick={processTryOn} disabled={isLoading || !humanFile || !garmentFile}>{isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}Generate Try-On</Button> </motion.div>
                                </CardContent>
                            </Card>
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                            <Card className="bg-gray-900/60 border-transparent backdrop-blur-sm min-h-[500px] glowing-border-red glowing-border-red-active">
                                <CardHeader><CardTitle className="flex items-center text-red-400"><Sparkles className="w-6 h-6 mr-3" />Result</CardTitle></CardHeader>
                                <CardContent className="flex flex-col items-center justify-center h-full">
                                    {/* --- MODIFIED: Restructured result area for better image fitting and new buttons --- */}
                                    <div className="w-full grid grid-cols-2 gap-2 h-80">
                                        {/* Final Image Box */}
                                        <div className="bg-gray-800/50 rounded-lg flex flex-col items-center justify-center p-1">
                                            <p className="text-xs text-gray-400 mb-1">Final Image</p>
                                            <div className="w-full h-full relative group">
                                                {isLoading ? (
                                                    <div className="flex items-center justify-center h-full"><Server className="w-12 h-12 text-red-400" /></div>
                                                ) : resultImage ? (
                                                    <>
                                                        <img src={resultImage} alt="Try-on result" className="w-full h-full object-contain rounded-md"/>
                                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button asChild size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20">
                                                                <a href={resultImage} download={`try-on-result-${Date.now()}.png`}><Download className="h-4 w-4"/></a>
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => { setFullscreenImageUrl(resultImage); setIsFullscreen(true); }}>
                                                                <Expand className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full"><PersonStanding className="w-12 h-12"/><p className="mt-2 text-sm">Result</p></div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Generated Mask Box */}
                                        <div className="bg-gray-800/50 rounded-lg flex flex-col items-center justify-center p-1">
                                            <p className="text-xs text-gray-400 mb-1">Generated Mask</p>
                                            <div className="w-full h-full relative group">
                                                {isLoading ? (
                                                    <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
                                                ) : maskImage ? (
                                                    <>
                                                        <img src={maskImage} alt="Generated mask" className="w-full h-full object-contain rounded-md"/>
                                                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button asChild size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20">
                                                                <a href={maskImage} download={`try-on-mask-${Date.now()}.png`}><Download className="h-4 w-4"/></a>
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => { setFullscreenImageUrl(maskImage); setIsFullscreen(true); }}>
                                                                <Expand className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full"><div className="w-12 h-12 border-2 border-dashed border-gray-600 rounded"/><p className="mt-2 text-sm">Mask</p></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 w-full p-4 rounded-lg bg-black/30 border border-gray-700"> <Badge variant={isError ? "destructive" : "secondary"} className={`mb-2 ${isError ? 'bg-red-900/50 text-red-300' : 'bg-red-900/50 text-red-300'}`}>{isError ? <XCircle className="w-4 h-4 mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}Status</Badge> <p className={`text-sm ${isError ? 'text-red-300' : 'text-gray-300'} font-mono`}>{statusMessage}</p> </div>
                                    {isLoading && <div className="w-full bg-gray-700 h-2.5 rounded-full mt-4"><motion.div className="bg-gradient-to-r from-red-500 to-orange-500 h-2.5 rounded-full" initial={{width:'0%'}} animate={{width:`${loadingProgress}%`}}/></div>}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
}