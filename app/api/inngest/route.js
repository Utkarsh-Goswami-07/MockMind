export const dynamic = "force-dynamic";

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { generateIndustryInsights } from "@/lib/inngest/functions";

// Serve the function(s) to Inngest
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        generateIndustryInsights,
    ],
});

