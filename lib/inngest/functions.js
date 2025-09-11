import { db } from "@/lib/prisma";
import { inngest } from "./client";

export const generateIndustryInsights = inngest.createFunction(
    { id: "generate-industry-insights", name: "Generate Industry Insights" },
    { cron: "0 0 * * 0" }, // Run every Sunday at midnight
    async ({ step }) => {
        const industries = await step.run("Fetch industries", async () => {
            return await db.industryInsight.findMany({
                select: { industry: true },
            });
        });

        for (const { industry } of industries) {
            // Dummy insights for testing
            const insights = {
                salaryRanges: [
                    { role: "Software Engineer", min: 50000, max: 120000, median: 80000, location: "Remote" },
                ],
                growthRate: 12,
                demandLevel: "HIGH",       // 🔥 CHANGED: was "High"
                topSkills: ["JavaScript", "React", "Node.js"],
                marketOutlook: "POSITIVE", // 🔥 CHANGED: was "Positive"
                keyTrends: ["AI Adoption", "Remote Work", "Cloud Migration"],
                recommendedSkills: ["Next.js", "Prisma", "TypeScript"],
            };

            await step.run(`Upsert ${industry} insights`, async () => {
                await db.industryInsight.upsert({
                    where: { industry },
                    update: {
                        ...insights,
                        lastUpdated: new Date(),
                        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
            });
        }
    }
);

