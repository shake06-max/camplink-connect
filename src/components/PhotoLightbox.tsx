import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PhotoLightbox = ({
  photos,
  open,
  onOpenChange,
  startIndex = 0,
}: {
  photos: string[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  startIndex?: number;
}) => {
  const [i, setI] = useState(startIndex);
  useEffect(() => { if (open) setI(startIndex); }, [open, startIndex]);
  if (!photos.length) return null;
  const prev = () => setI((p) => (p - 1 + photos.length) % photos.length);
  const next = () => setI((p) => (p + 1) % photos.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-background/95 p-2">
        <div className="relative flex items-center justify-center">
          <img src={photos[i]} alt="" className="max-h-[80vh] max-w-full rounded-lg object-contain" />
          {photos.length > 1 && (
            <>
              <Button variant="secondary" size="icon" className="absolute left-2 rounded-full" onClick={prev}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon" className="absolute right-2 rounded-full" onClick={next}>
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {i + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
