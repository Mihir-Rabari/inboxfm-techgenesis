import { Atom } from "@phosphor-icons/react/dist/ssr";

export const VedLabsLogo = ({ className }: { className?: string }) => (
    <div className={`flex items-center gap-3 font-black text-2xl tracking-tighter ${className}`}>
        <div className="bg-gradient-to-br from-primary to-orange-600 text-primary-foreground p-1.5 rounded-xl shadow-lg shadow-primary/20">
            <Atom size={24} weight="fill" />
        </div>
        <div className="flex flex-col leading-none">
            <span className="text-white font-black tracking-tighter">VEDLABS</span>
            <span className="text-[8px] text-muted-foreground font-bold tracking-[0.3em] uppercase mt-0.5">Advanced Systems</span>
        </div>
    </div>
);
