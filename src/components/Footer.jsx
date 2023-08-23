import BotFooter from "../services/footer/BotFooter";

function Footer() {
  return (
    <div className="footer w-full bottom-0 px-5 py-10 flex-box flex-col bg-slate-900 scroll-smooth text-center">
      <div className="w-full h-px"></div>
      <BotFooter />
    </div>
  );
}

export default Footer;
