import { redirect } from "next/navigation";
import { industries } from "@/data/industries";
import { getUserOnboardingStatus } from "@/actions/user";
import OnboardingForm from "@/app/(main)/onboarding/_components/onboarding-form";

export default async function OnboardingPage() {
    // Check if user is already onboarded
    const { isOnboarded } = await getUserOnboardingStatus();

    if (isOnboarded) {
        redirect("/dashboard");
    }

    return (
        <main>
            <OnboardingForm industries={industries} />
        </main>
    );
}