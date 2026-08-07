using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using NAudio.CoreAudioApi;
using NAudio.Wave;

namespace QuarticPulse.WindowsAudio
{
    internal static class Program
    {
        private const int OutputSampleRate = 48000;
        private static readonly Guid IeeeFloatSubFormat = new Guid("00000003-0000-0010-8000-00aa00389b71");
        private static readonly object OutputLock = new object();
        private static readonly ManualResetEvent Finished = new ManualResetEvent(false);
        private static Stream standardOutput;
        private static double resampleAccumulator;

        private static int Main(string[] args)
        {
            try
            {
                if (args.Length == 1 && args[0] == "list") return ListRenderDevices();
                if (args.Length == 2 && args[0] == "capture") return CaptureRenderDevice(args[1]);
                Console.Error.WriteLine("Usage: QuarticPulse.AudioCapture.exe list | capture <base64-device-id>");
                return 2;
            }
            catch (Exception error)
            {
                Console.Error.WriteLine("ERROR " + error.Message);
                return 1;
            }
        }

        private static int ListRenderDevices()
        {
            using (var enumerator = new MMDeviceEnumerator())
            {
                string defaultId = null;
                try
                {
                    defaultId = enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia).ID;
                }
                catch { }

                foreach (var device in enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active))
                {
                    var id = Convert.ToBase64String(Encoding.UTF8.GetBytes(device.ID));
                    var name = Convert.ToBase64String(Encoding.UTF8.GetBytes(device.FriendlyName));
                    Console.WriteLine(id + "|" + name + "|" + (device.ID == defaultId ? "1" : "0"));
                }
            }
            return 0;
        }

        private static int CaptureRenderDevice(string encodedDeviceId)
        {
            var requestedId = Encoding.UTF8.GetString(Convert.FromBase64String(encodedDeviceId));
            using (var enumerator = new MMDeviceEnumerator())
            using (var device = enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active)
                .FirstOrDefault(candidate => candidate.ID == requestedId))
            {
                if (device == null) throw new InvalidOperationException("The selected Windows output device is no longer available.");
                using (var capture = new WasapiLoopbackCapture(device))
                {
                    standardOutput = Console.OpenStandardOutput();
                    capture.DataAvailable += (sender, eventArgs) => WriteMonoFloatSamples(eventArgs.Buffer, eventArgs.BytesRecorded, capture.WaveFormat);
                    capture.RecordingStopped += (sender, eventArgs) =>
                    {
                        if (eventArgs.Exception != null) Console.Error.WriteLine("ERROR " + eventArgs.Exception.Message);
                        Finished.Set();
                    };
                    Console.Error.WriteLine("READY " + device.FriendlyName);
                    capture.StartRecording();
                    Finished.WaitOne();
                }
            }
            return 0;
        }

        private static void WriteMonoFloatSamples(byte[] buffer, int byteCount, WaveFormat format)
        {
            try
            {
                var frameCount = byteCount / format.BlockAlign;
                if (frameCount <= 0) return;
                var maximumOutputFrames = (int)Math.Ceiling(frameCount * (double)OutputSampleRate / format.SampleRate) + 2;
                var output = new float[maximumOutputFrames];
                var outputCount = 0;
                for (var frame = 0; frame < frameCount; frame++)
                {
                    var sum = 0.0f;
                    var frameOffset = frame * format.BlockAlign;
                    var bytesPerSample = format.BlockAlign / format.Channels;
                    for (var channel = 0; channel < format.Channels; channel++)
                    {
                        sum += ReadSample(buffer, frameOffset + channel * bytesPerSample, bytesPerSample, format);
                    }
                    var mono = Math.Max(-1.0f, Math.Min(1.0f, sum / Math.Max(1, format.Channels)));
                    resampleAccumulator += OutputSampleRate;
                    while (resampleAccumulator >= format.SampleRate)
                    {
                        output[outputCount++] = mono;
                        resampleAccumulator -= format.SampleRate;
                    }
                }
                if (outputCount == 0) return;
                var bytes = new byte[outputCount * sizeof(float)];
                Buffer.BlockCopy(output, 0, bytes, 0, bytes.Length);
                lock (OutputLock)
                {
                    standardOutput.Write(bytes, 0, bytes.Length);
                    standardOutput.Flush();
                }
            }
            catch
            {
                Finished.Set();
            }
        }

        private static float ReadSample(byte[] buffer, int offset, int bytesPerSample, WaveFormat format)
        {
            var floatFormat = format.Encoding == WaveFormatEncoding.IeeeFloat;
            var extensible = format as WaveFormatExtensible;
            if (extensible != null)
            {
                floatFormat = extensible.SubFormat == IeeeFloatSubFormat;
            }
            if (floatFormat && bytesPerSample == 4) return BitConverter.ToSingle(buffer, offset);
            if (floatFormat && bytesPerSample == 8) return (float)BitConverter.ToDouble(buffer, offset);
            if (bytesPerSample == 2) return BitConverter.ToInt16(buffer, offset) / 32768.0f;
            if (bytesPerSample == 3)
            {
                var value = buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
                if ((value & 0x800000) != 0) value |= unchecked((int)0xFF000000);
                return value / 8388608.0f;
            }
            if (bytesPerSample == 4) return BitConverter.ToInt32(buffer, offset) / 2147483648.0f;
            return 0;
        }
    }
}
