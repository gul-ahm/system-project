import whisper
import yt_dlp
import os

VIDEO_URL = "https://www.youtube.com/watch?v=c_1eG44n3iA"
AUDIO_FILE = "downloaded_audio.mp3"

def download_audio():
    """Downloads audio from a YouTube video."""
    if os.path.exists(AUDIO_FILE):
        print(f"'{AUDIO_FILE}' already exists. Skipping download.")
        return

    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': 'downloaded_audio'
    }
    print(f"Downloading audio from {VIDEO_URL}...")
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([VIDEO_URL])
    print("Download complete.")

def transcribe_audio():
    """Transcribes the audio file using Whisper."""
    if not os.path.exists(AUDIO_FILE):
        print(f"Error: Audio file '{AUDIO_FILE}' not found.")
        return

    print("Loading Whisper model (base)...")
    # Using the "base" model is a good balance of speed and accuracy
    model = whisper.load_model("base")

    print("Transcribing audio... (This may take a few minutes)")
    result = model.transcribe(AUDIO_FILE)

    transcript_file = "video_transcript.txt"
    with open(transcript_file, "w", encoding="utf-8") as f:
        f.write(result["text"])

    print(f"Transcription complete! Saved to '{transcript_file}'")

if __name__ == "__main__":
    download_audio()
    transcribe_audio()