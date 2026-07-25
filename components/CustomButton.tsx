import React from 'react';
interface Props { text: string; onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; icon?: React.ReactNode; disabled?: boolean; className?: string; }
const CustomButton: React.FC<Props> = ({ text, onClick, icon, disabled, className = '' }) => <button className={`button button-primary ${className}`} onClick={onClick} disabled={disabled}>{icon}{text}</button>;
export default CustomButton;
