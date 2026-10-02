import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SearchIcon, AlertTriangleIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <SearchIcon className="h-12 w-12 text-gray-300 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="text-gray-600">
          That page does not exist. If you are trying to reach an emergency,
          use the button below.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="primary">Go to dashboard</Button>
          </Link>
          <Link href="/emergency">
            <Button variant="danger">
              <AlertTriangleIcon className="h-4 w-4 mr-2" />
              SOS
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}