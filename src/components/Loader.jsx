export const Loader = () => {
    return (
        <div className="h-full w-full flex-box flex-col gap-y-4">
            <div className="w-12 h-12 relative animate-bounce">
                <img alt="logo" src="/logo.png"/>
            </div>
            <p className="text-md text-slate-100">
                TeethSeg is predicting...
            </p>
        </div>
    )
}