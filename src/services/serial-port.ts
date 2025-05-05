/**
 * Represents the response from the COM port.
 */
export interface SerialResponse {
  /**
   * The data received from the COM port as a string.
   */
  data: string;
}

let activePort: SerialPort | undefined; // Keep activePort global

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

    console.log(`Serial port opened with baud rate ${baudRate}`);
  } catch (error: any) {
    console.error(`Error opening serial port: ${error.message}`);
    activePort = undefined;
    throw error;
  }
}

/**
 * Asynchronously closes a serial port connection.
 * @param portName The name of the serial port to close (e.g., 'COM3').
 * @returns A promise that resolves when the port is successfully closed, or rejects if an error occurs.
 */
export async function closeSerialPort(portName: string): Promise<void> {

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
 * Reads until a newline character is received or a timeout occurs.
 * @param portName The name of the serial port to send the command to (e.g., 'COM3'). (Note: PortName is not used for sending in Web Serial API after connection)
 * @param command The command to send to the serial port.
 * @param timeout Optional timeout in milliseconds for reading the response. Defaults to 2500ms.
 * @returns A promise that resolves with the SerialResponse from the COM port.
 */
export async function sendSerialCommand(portName: string, command: string, timeout: number = 2500): Promise<SerialResponse> {
  // Check if activePort is available and appears valid
  if (!activePort || !activePort.readable || !activePort.writable) {
    throw new Error("Serial port is not properly initialized or has been closed.");
  }
  
  // Acquire reader and writer locally for this specific command
  const reader = activePort.readable.getReader();
  const writer = activePort.writable.getWriter();
  
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let responseData = "";
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Serial read timeout")), timeout));

  try {
    await writer.write(encoder.encode(command));

    while (true) {
      const readPromise = reader.read();
      const { value, done } = await Promise.race([readPromise, timeoutPromise]);

      if (done) {
        break;
      }

      responseData += decoder.decode(value);

      // Check for newline character as end of response
      if (responseData.includes('\\n')) {
        // Trim any characters after the first newline if necessary
        responseData = responseData.substring(0, responseData.indexOf('\\n') + 1);
        break;
      }
    }
  } catch (error: any) {
    // If the error is due to timeout, log a warning and return the partial response
    if (error.message === "Serial read timeout") {
       console.warn(`Serial read timeout (${timeout}ms) occurred. Returning partial response: ${responseData}`);
    } else {
      // For any other error, re-throw it
      throw error;
    }
  } finally {
    // Release the locks in the finally block to ensure they are always released
    try {
      await reader.cancel(); // Cancel any pending reads
      reader.releaseLock();
      console.log("Reader lock released.");
    } catch (error) {
      console.warn("Error releasing reader lock:", error);
    }
  
    try {
      // Note: Releasing writer lock might not always be necessary immediately,
      // but it's good practice for consistency, especially if write errors occur.
      writer.releaseLock();
      console.log("Writer lock released.");
    } catch (error) {
      console.warn("Error releasing writer lock:", error);
    }
  }

  return {
    data: responseData.trim(), // Trim whitespace, including the newline
  };
}
