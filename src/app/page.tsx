"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sendSerialCommand, SerialResponse } from "@/services/serial-port";
import { cn } from "@/lib/utils";
import { useSerialPortConnection } from "@/hooks/use-serial-port-connection";

interface CommandQueueItem {
  id: number;
  command: string;
  response: string;
  Vi: string;
  Ii: string;
  Pi: string;
  Vo: string;
  Io: string;
  Po: string;
  Eff: string;
}

export default function Home() {
  const com3PortName = "COM3";
  const com6PortName = "COM6";
  const baudRate = 9600;

  const { isOpen: com3PortOpen, statusMessage: com3PortStatusMessage, togglePort: toggleCom3Port } = useSerialPortConnection(com3PortName, baudRate);
  const { isOpen: com6PortOpen, statusMessage: com6PortStatusMessage, togglePort: toggleCom6Port } = useSerialPortConnection(com6PortName, baudRate);

  const [command, setCommand] = useState("");
  const [commandQueue, setCommandQueue] = useState<CommandQueueItem[]>([]);
  const [nextId, setNextId] = useState(1);

  const addCommandToQueue = () => {
    if (command.trim() !== "") {
      setCommandQueue([...commandQueue, {
        id: nextId,
        command: command.trim(),
        response: "",
        Vi: "",
        Ii: "",
        Pi: "",
        Vo: "",
        Io: "",
        Po: "",
        Eff: "",
      }]);
      setNextId(nextId + 1);
      setCommand(""); // Clear the input after adding to the queue
    }
  };

  const sendCommandsToComPort = async () => {
    for (const item of commandQueue) {
      try {
        const response: SerialResponse = await sendSerialCommand(com3PortName, `${item.command}
`);
        setCommandQueue((prevQueue) =>
          prevQueue.map((queueItem) =>
            queueItem.id === item.id ? { ...queueItem, response: response.data } : queueItem
          )
        );
      } catch (error: any) {
        setCommandQueue((prevQueue) =>
          prevQueue.map((queueItem) =>
            queueItem.id === item.id ? { ...queueItem, response: `Error: ${error.message}` } : queueItem
          )
        );
      }
    }
  };

  const updateQueueItem = (id: number, field: keyof CommandQueueItem, value: string) => {
    setCommandQueue((prevQueue) =>
      prevQueue.map((queueItem) =>
        queueItem.id === id ? { ...queueItem, [field]: value } : queueItem
      )
    );
  };

  return (
    <div className="container mx-auto p-4 flex flex-col gap-4">
      {/* COM3 Port Toggle */}
      <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800 p-4 rounded shadow">
        <span className="font-semibold">COM3 Port Status: {com3PortStatusMessage}</span>
        <Button variant="outline" onClick={toggleCom3Port} className={cn(com3PortOpen ? "bg-teal-500 hover:bg-teal-700 text-white" : "")}>
          {com3PortOpen ? "Disconnect COM3" : "Connect COM3"}
        </Button>
      </div>

      {/* COM6 Port Toggle */}
      <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800 p-4 rounded shadow">
        <span className="font-semibold">COM6 Port Status: {com6PortStatusMessage}</span>
        <Button variant="outline" onClick={toggleCom6Port} className={cn(com6PortOpen ? "bg-teal-500 hover:bg-teal-700 text-white" : "")}>
          {com6PortOpen ? "Disconnect COM6" : "Connect COM6"}
        </Button>
      </div>


      {/* Command Input */}
      <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-800 p-4 rounded shadow">
        <Input
          type="text"
          placeholder="Enter command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="flex-grow font-mono"
        />
        <Button onClick={addCommandToQueue} className="bg-blue-500 hover:bg-blue-700 text-white font-bold">
          Add to Queue
        </Button>
      </div>

      {/* Commands Queue List */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Command</TableHead>
              <TableHead>Response</TableHead>
              <TableHead>Vi</TableHead>
              <TableHead>Ii</TableHead>
              <TableHead>Pi</TableHead>
              <TableHead>Vo</TableHead>
              <TableHead>Io</TableHead>
              <TableHead>Po</TableHead>
              <TableHead>Eff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commandQueue.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell className="font-mono">{item.command}</TableCell>
                <TableCell className="font-mono">{item.response}</TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={item.Vi}
                    onChange={(e) => updateQueueItem(item.id, "Vi", e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={item.Ii}
                    onChange={(e) => updateQueueItem(item.id, "Ii", e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={item.Pi}
                    onChange={(e) => updateQueueItem(item.id, "Pi", e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={item.Vo}
                    onChange={(e) => updateQueueItem(item.id, "Vo", e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={item.Io}
                    onChange={(e) => updateQueueItem(item.id, "Io", e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={item.Po}
                    onChange={(e) => updateQueueItem(item.id, "Po", e.target.value)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={item.Eff}
                    onChange={(e) => updateQueueItem(item.id, "Eff", e.target.value)}
                    className="w-20"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Send to COM Button */}
      <Button onClick={sendCommandsToComPort} disabled={!com3PortOpen} className="bg-teal-600 hover:bg-teal-800 text-white font-bold">
        Send to COM
      </Button>
    </div>
  );
}

