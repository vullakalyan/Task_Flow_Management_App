import { useNavigate } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';
import { PageWrapper, Navbar } from '../components/layout';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
      <Navbar />
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-16 text-center h-full">
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-white/5 text-white/40 mb-6 border border-white/5">
            <FileQuestion className="h-12 w-12" />
          </div>
          <h1 className="text-4xl font-bold text-white/90 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-white/60 mb-4">Page not found</h2>
          <p className="text-white/40 max-w-md mb-8">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
          <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}

export default NotFoundPage;
