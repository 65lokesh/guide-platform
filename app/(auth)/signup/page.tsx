import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div>
        <h1 className="text-2xl font-medium mb-6">Create your account</h1>
        <SignupForm />
      </div>
    </div>
  );
}