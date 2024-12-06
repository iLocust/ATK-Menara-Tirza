import * as React from "react"

const Button = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`
        inline-flex items-center justify-center 
        whitespace-nowrap rounded-md text-sm font-medium 
        transition-colors focus-visible:outline-none 
        focus-visible:ring-1 focus-visible:ring-white-950
        disabled:pointer-events-none disabled:opacity-50
        bg-white-900 text-black shadow hover:  bg-[#ffffff]
 px-4 py-2
        ${className}`}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }