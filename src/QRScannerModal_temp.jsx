
// --- QR SCANNER MODAL ---
const QRScannerModal = ({ visible, onClose, onScan }) => {
    const [error, setError] = useState('');
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        let html5QrCode;

        const startScanning = async () => {
            if (visible && !scanning) {
                try {
                    html5QrCode = new Html5Qrcode("reader");
                    scannerRef.current = html5QrCode;

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
                        (decodedText, decodedResult) => {
                            // Success callback
                            onScan(decodedText);
                            // Stop scanning immediately after success
                            if (html5QrCode && html5QrCode.isScanning) {
                                html5QrCode.stop().then(() => {
                                    html5QrCode.clear();
                                    setScanning(false);
                                }).catch(err => console.error("Failed to stop scanner", err));
                            }
                        },
                        (errorMessage) => {
                            // Error callback - ignore frame parse errors
                            // console.log(errorMessage);
                        }
                    );
                    setScanning(true);
                    setError('');
                } catch (err) {
                    console.error("Error starting scanner:", err);
                    setError('ไม่สามารถเปิดเมนูได้ กรุณาอนุญาตการใช้งานกล้อง');
                    setScanning(false);
                }
            }
        };

        if (visible) {
            setTimeout(startScanning, 300); // Small delay to ensuring DOM is ready
        }

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current.clear();
                }).catch(err => console.error("Cleanup error", err));
            }
        };
    }, [visible]);

    return (
        <>
            <div
                className={`fixed inset-0 z-[400] bg-[#fcfcfc] backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <div className={`fixed inset-0 z-[401] pointer-events-none flex items-center justify-center p-4`}>
                <div
                    className={`w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${visible ? 'scale-100 pointer-events-auto' : 'scale-90 pointer-events-none'}`}
                >
                    <div className="p-4 flex items-center justify-between border-b border-gray-100">
                        <h3 className="font-black text-gray-900 ml-2">สแกน QR Code</h3>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:scale-95 transition-transform">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="relative bg-black aspect-square overflow-hidden">
                        <div id="reader" className="w-full h-full"></div>
                        {!scanning && !error && (
                            <div className="absolute inset-0 flex items-center justify-center text-white/50">
                                <Loader2 className="animate-spin" size={32} />
                            </div>
                        )}
                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                                <AlertCircle size={48} className="mb-4 text-red-500" />
                                <p className="font-bold">{error}</p>
                                <button
                                    onClick={onClose}
                                    className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold text-sm"
                                >
                                    ปิด
                                </button>
                            </div>
                        )}
                        <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none">
                            <div className="absolute inset-0 border-2 border-white/50 rounded-lg"></div>
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00704A] -mt-1 -ml-1 rounded-tl-lg"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00704A] -mt-1 -mr-1 rounded-tr-lg"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00704A] -mb-1 -ml-1 rounded-bl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00704A] -mb-1 -mr-1 rounded-br-lg"></div>
                        </div>
                    </div>

                    <div className="p-6 text-center">
                        <p className="text-gray-500 font-bold text-sm">สแกน QR Code โปรโมชั่น</p>
                        <p className="text-xs text-gray-400 mt-1">วางโค้ดให้อยู่ในกรอบสี่เหลี่ยม</p>
                    </div>
                </div>
            </div>
        </>
    );
};
