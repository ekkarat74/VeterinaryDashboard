import React from 'react';

const Footer = React.memo(() => {
    return (
        <footer className="bg-white border-t border-slate-200 py-3 px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] sm:text-xs text-slate-500 shrink-0 z-20 w-full mt-auto">
            <div className="font-medium">
                &copy; {new Date().getFullYear()} สำนักงานสัตวแพทย์สาธารณสุข สำนักอนามัย กรุงเทพมหานคร
            </div>
        </footer>
    );
});

export default Footer;