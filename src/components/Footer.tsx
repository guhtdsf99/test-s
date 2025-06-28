
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CSWORD. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-gray-500 text-sm hover:text-[#907527]">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-500 text-sm hover:text-[#907527]">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
