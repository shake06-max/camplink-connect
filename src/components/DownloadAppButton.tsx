import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DownloadAppButton = () => (
  <a href="/camplink.apk" download="camplink.apk" title="Download Camplink Android app">
    <Button variant="ghost" size="icon" className="h-9 w-9 text-primary">
      <Download className="h-5 w-5" />
    </Button>
  </a>
);
