import re

with open("components/CustomButton.tsx", "r") as f:
    content = f.read()

target = r"const CustomButton: React.FC<CustomButtonProps> = .*?export default CustomButton;"

replacement = r"""const CustomButton: React.FC<CustomButtonProps> = ({ text, onClick, icon, disabled, className = '' }) => {
  return (
    <button
      className={`h-12 border border-transparent rounded-[7px] px-5 bg-nexus-lime text-nexus-ink font-black cursor-pointer uppercase tracking-[0.06em] text-[0.76rem] transition-all duration-180 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:bg-nexus-limedeep flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon} {text}
    </button>
  );
};

export default CustomButton;"""

content = re.sub(target, replacement, content, flags=re.DOTALL)

with open("components/CustomButton.tsx", "w") as f:
    f.write(content)
