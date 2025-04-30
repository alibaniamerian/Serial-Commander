/**
 * Represents the response from the COM port.
 */
export interface SerialResponse {
  /**
   * The data received from the COM port as a string.
   */
  data: string;
}

let activePort: SerialPort | undefined;
let reader: ReadableStreamDefaultReader | undefined;
let writer: WritableStreamDefaultWriter | undefined;

/**
 * Asynchronously opens a serial port connection.
 * @param portName The name of the serial port to open (e.g., 'COM3'). Note: Web Serial API does not use port names like COM3, the user selects the port via a browser prompt.
 * @param baudRate The baud rate for the serial communication.
 * @returns A promise that resolves when the port is successfully opened, or rejects if an error occurs.
 */
export async function openSerialPort(portName: string, baudRate: number): Promise<void> {
  if (!('serial' in navigator)) {
    throw new Error('Web Serial API not supported in this browser.');
  }

  try {
    // Prompt user to select a port
    activePort = await navigator.serial.requestPort();

    // Open the port
    await activePort.open({ baudRate });

    // Get readers and writers
    reader = activePort.readable?.getReader();
    writer = activePort.writable?.getWriter();

    console.log(`Serial port opened with baud rate ${baudRate}`);
  } catch (error: any) {
    console.error(`Error opening serial port: ${error.message}`);
    activePort = undefined;
    reader = undefined;
    writer = undefined;
    throw error;
  }
}

/**
 * Asynchronously closes a serial port connection.
 * @param portName The name of the serial port to close (e.g., 'COM3').
 * @returns A promise that resolves when the port is successfully closed, or rejects if an error occurs.
 */
export async function closeSerialPort(portName: string): Promise<void> {
  if (reader) {
    await reader.cancel();
    reader.releaseLock();
    reader = undefined;
  }
  if (writer) {
    writer.releaseLock();
    writer = undefined;
  }
  if (activePort) {
    try {
      await activePort.close();
      activePort = undefined;
      console.log("Serial port closed.");
    } catch (error: any) {
      console.error(`Error closing serial port: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Asynchronously sends a command to the specified serial port and returns the response.
 * @param portName The name of the serial port to send the command to (e.g., 'COM3').
 * @param command The command to send to the serial port.
 * @returns A promise that resolves with the SerialResponse from the COM port.
 */
export async function sendSerialCommand(portName: string, command: string): Promise<SerialResponse> {
  if (!writer) {
    throw new Error("Serial port is not open.");
  }

  const encoder = new TextEncoder();
  await writer.write(encoder.encode(command));

  // Assuming a response is expected, read from the port.
  // This is a basic implementation and might need adjustments
  // based on how your serial device sends responses.
  let responseData = "";
  const decoder = new TextDecoder();
  if (reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      responseData += decoder.decode(value);
      // Add logic here to determine end of response if needed
      // For example, break if a specific character is received.
    }
  }

  return {
    data: responseData,
  };
}
