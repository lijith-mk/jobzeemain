import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    // Go back to previous page, or to jobs page if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/jobs');
    }
  };

  return (
    <div className="text-center mt-20">
      <h1 className="text-6xl font-bold text-red-600">404</h1>
      <p className="text-xl mt-4">Oops! Page not found.</p>
      <button 
        onClick={handleGoBack}
        className="text-blue-600 underline mt-6 inline-block hover:text-blue-800"
      >
        Go Back
      </button>
    </div>
  );
};

export default PageNotFound;
