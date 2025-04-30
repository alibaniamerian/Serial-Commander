import { useState, useEffect } from "react";
import { openSerialPort, closeSerialPort } from "@/services/serial-port";

interface UseSerialPortConnection {
  isOpen: boolean;
  statusMessage: string;
  togglePort: () => Promise<void>;
}

export const useSerialPortConnection = (portName: string, baudRate: number): UseSerialPortConnection => {
  const [isOpen, setOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(`${portName} Port Disconnected`);

  useEffect(() => {
    // Update status message based on isOpen state
    setStatusMessage(isOpen ? `${portName} Port Connected` : `${portName} Port Disconnected`);
  }, [isOpen, portName]);

  const togglePort = async () => {
    try {
      if (!isOpen) {
        await openSerialPort(portName, baudRate);
        setOpen(true);
      } else {
        await closeSerialPort(portName);
        setOpen(false);
      }
    } catch (error: any) {
      setStatusMessage(`Error toggling ${portName} port: ${error.message}`);
    }
  };

  return {
    isOpen,
    statusMessage,
    togglePort,
  };
};
