import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Get references to all necessary DOM elements
const dropZone = document.getElementById('dropZone') as HTMLElement;
const imageUpload = document.getElementById('imageUpload') as HTMLInputElement;
const imagePreview = document.getElementById('imagePreview') as HTMLImageElement;
const dropZoneContent = document.getElementById('dropZoneContent') as HTMLElement;
const styleOptions = document.querySelectorAll('.style-option');
const generateButton = document.getElementById('generateButton') as HTMLButtonElement;
const imageContainer = document.getElementById('imageContainer') as HTMLElement;
const generatedImage = document.getElementById('generatedImage') as HTMLImageElement;
const errorMessage = document.getElementById('errorMessage') as HTMLElement;
const buttonText = document.getElementById('buttonText') as HTMLSpanElement;
const buttonSpinner = document.getElementById('buttonSpinner') as HTMLElement;
const downloadButton = document.getElementById('downloadButton') as HTMLAnchorElement;
const loadingIndicator = document.getElementById('loadingIndicator') as HTMLElement;
const progressBar = document.getElementById('progressBar') as HTMLElement;
const loadingMessage = document.getElementById('loadingMessage') as HTMLElement;


let uploadedImageBase64: string | null = null;
let uploadedImageMimeType: string | null = null;
let selectedStyle: string | null = null;
let messageInterval: number | null = null;

const loadingMessages = [
    'AI đang phân tích ảnh của bạn...',
    'Đang phác thảo những nét vẽ đầu tiên...',
    'Thêm các chi tiết ma thuật...',
    'Sắp hoàn thành tác phẩm rồi!',
    'Chờ một chút nữa thôi...'
];

// Map styles to a detailed prompt for image generation
const stylePrompts: { [key: string]: string } = {
    "Đá Vụn": "A hyper-real 3D composition where separate rock pieces assemble into [upload person]. Style: fragmented slate + sandstone shards, each piece clearly detached with small gaps; chiseled edges, visible stone grain. Look: minimal off-white background, soft studio light from top-left, subtle shadows, slight warm-ochre accents among dark slate. Framing: centered, clean, straight-on. Add a few tiny debris chips for depth. No text, no extra props. Make the pieces clearly separated and readable.",
    "Sóng Nước Kết Tinh": "A breathtaking artistic bust of the {upload person}, sculpted entirely from crystalized ocean waves, frozen mid-motion into elegant, flowing forms. The waves curl and crash seamlessly into the contours of the face, with translucent layers of sapphire and turquoise glass shimmering under the light. Tiny droplets are suspended like gems, catching reflections as if alive. The texture is both fluid and solid, creating a surreal balance between water and stone. Subtle glowing veins of bioluminescence weave through the sculpture, adding an ethereal underwater aura. The overall style emphasizes motion, fluidity, and transcendence, as if the subject is emerging timelessly from the ocean’s embrace. Background should be deep, aquatic, and softly glowing, evoking the mysterious calm of the deep sea while enhancing the sculpture’s glassy brilliance and intricate details.",
    "Chuối Vàng": "A hyper-detailed artistic bust of the subject, entirely crafted from golden nano-bananas fused together, forming an intricate, organic texture. The bananas are polished to a glossy sheen, with realistic peel curves integrated into the structure. Each nano-banana reflects soft, warm light, creating a luxurious and surreal appearance. The design emphasizes precision, elegance, and innovation, with a futuristic museum display vibe. Background should be minimalistic, dark, and softly lit to enhance the sculpture’s golden glow and fine details",
    "Tượng Gỗ Bán Thân": "Realistic museum bust statue of {upload person}, carved {material: sandstone/terracotta}, wearing a suit & tie. Round chest medallion embossed with “{$}”. Add signature props: {props}. On a wooden shelf with lamp + mug, soft fireplace bokeh, warm tungsten light, subtle rim-light, shallow DOF, ultra-detailed sculpture texture",
    "Cà Phê Bọt": "A cappuccino with foam art shaped like [upload person], chubby features and defining traits etched in milk art, surrounded by soft crema bubbles, top-down view, served in a clean white ceramic cup.",
    "Khối Treo Lập Phương": "Photoreal museum installation: thousands of small matte white cubes suspended by thin transparent strings from the ceiling, forming the shape of [upload person]. Minimal white gallery, track lights and a long linear ceiling light; soft volumetric lighting; polished concrete floor showing a crisp mosaic shadow of the same shape. Eye-level view, 35–50mm, ultra-detailed, clean, no extra text or watermark",
    "Bong Bóng Chân Dung": "3D-rendered, minimalist portrait of (uploader portrait) on a pure black background. Centered composition with a floating translucent monochrome sphere around his head and shoulders; inside the sphere, subtly stacked plate-like layers visible through the glass. Add soft blue and amber glow gradients that rim-light the face and sphere. Keep it balanced, clean, futuristic, with minimal elements, high contrast, and crisp reflections on a glossy surface; shallow depth of field; no extra text, no watermark.",
    "Ngồi Cùng Máy Quay": "A charismatic (upload person) sits cross‑legged on a clean studio floor, wearing large over‑ear headphones, a snug white ribbed tank top, {black athletic shorts or denim cut‑offs}, and classic black‑and‑white high‑top sneakers. They hold a chunky 1990s handheld camcorder pointed straight at the lens, index finger on the record button. In front of them rests a small square CRT television; on its screen, a full‑frame close‑up of the same **person**’s face mirrors their real‑time mood (smiling, pouting, sipping a drink through a straw, or squinting with a cigarette). Optional details: subtle film‑grain overlay, one or two minimalist leg tattoos, dangling AV cables, vintage “Panasonic‑style” logo plate. Lighting is soft, warm, and diffused against an off‑white seamless backdrop, giving a 35 mm retro portrait vibe with natural shadows and gentle contrast. Shot at eye level, cinematic composition, retro color grade.",
    "Xây Tượng Cho Tôi": "A hyper-realistic giant full-body statue of [uploaded person], showing their entire figure from head (including hair) to feet with all original clothing details intact, standing in the middle of a roundabout. The statue is under construction, surrounded by scaffolding and many construction workers in helmets and orange vests climbing on it. Realistic city background with cars and motorbikes around the roundabout. Bright blue sky, daytime, cinematic lighting, photorealistic 8K style, ultra-high-quality, highly detailed face and clothing",
    "Graffiti Trên Tường": "Please update this image to appear on the wall of a 5-story building. The focus should be on the character only and should be in a spray-painted style. The image should be large enough to fill the entire 5-story building. There are 5 young male and female characters spraying spray cans. The attached image content has spray cans placed and lined up on the concrete floor. Ultra-wide angle camera is recommended. Daytime atmosphere. 8K UHD HYPER-REALISTIC high definition details.",
    "Tượng Gỗ Chạm Khắc": "Hyper-realistic carved wooden figurine of [CHARACTER], chibi proportions (big head, short body), standing on a plain wood block. Keep key face traits and iconic [OUTFIT/PROP]. Visible wood grain and chisel marks, matte finish. Warm studio light, soft shadow, seamless beige background. Centered full-body, shallow depth of field (85mm look). Ultra-detailed, photoreal, warm sepia grading.",
    "Chân Dung Bong Bóng": "Create a surreal ultra-realistic 3D render styled as a collectible art toy balloon, featuring a cartoon face inflated like a shiny balloon while retaining the key facial features, likeness, and expressions of the uploaded photo. Keep hyper-detailed sculpted skin, subtle pores, exaggerated round chubby cheeks, oversized pouty lips, and playful cartoon proportions. A balloon knot sits at the base of the neck with a thin string hanging naturally, with everything below the neck and the background removed. The expression is comically whimsical, balanced with a surreal glossy finish. Use soft studio lighting on a smooth neutral beige background with cinematic depth of field, Pixar-quality stylization, poster-grade realism, and a polished sculptural finish. Strange yet charming surrealism, rendered with extreme detail and photographic clarity.",
    "Mô Hình 3D Figure": "Create a 1/7 scale commercialized figure of the character in the illustration, in a realistic style and environment. Place figure on a computer desk in front of computer screen, using a circular transparent acrylic base without any text. On the computer screen, display the Z-Brush modeling process of the figure. Next to the computer screen, place a Bandai-style toy packaging box printed with the original artwork and printed with the words Banana at the bottom corner.",
    "Khắc Ảnh Cẩm Thạch": "A photorealistic image of an ultra-detailed sculpture of the subject in the uploaded image, carved entirely from shining marble. The sculpture features a smooth and reflective marble surface with elegant, intricate engraved symbols and characters carved into the base (pedestal) of the statue, made from the same marble to create a seamless look. The design emphasizes artistic craftsmanship, the beauty and depth of marble, and the fine detailing of the engraved patterns. Dramatic, soft lighting enhances the sculpture’s contours, textures, and the glimmer of the polished stone, creating a visually stunning and mesmerizing effect.",
    "Cute Doll": "Transform the uploaded person into an adorable, super-cute chibi doll with large, expressive eyes and a small, simplified body. The doll should be made of a glossy vinyl material, resembling a popular collectible toy. Retain key facial features but exaggerate them for cuteness. The outfit should be a simplified version of what's in the photo. Place the doll in a soft, pastel-colored environment with a shallow depth of field. Style: Kawaii, chibi, cute, 3D render.",
    "Gundam Figure": "Reimagine the uploaded person as a pilot integrated into a custom Gundam or mecha suit. The face of the person should be visible inside the helmet or cockpit. The mecha suit design should be intricate, with detailed panel lines, mechanical joints, and glowing elements, inspired by classic Gundam series. The pose should be heroic and dynamic, set against a backdrop of a hangar or a futuristic battlefield. Style: Mecha, sci-fi, detailed, anime-inspired, photorealistic render.",
    "LEGO Figure": "Create a LEGO minifigure that looks exactly like the uploaded person. The face print on the cylindrical head should capture their key facial features and expression in the classic LEGO style. The torso and leg pieces should be printed to match the clothing in the uploaded photo. Place the minifigure on a LEGO baseplate, with a shallow depth of field to make it look like a macro photograph. The plastic should have a slight sheen and visible parting lines for maximum realism. Style: LEGO, minifigure, macro photography, realistic render.",
    "Tự Sướng Với Anh Hùng DC": "Photorealistic group selfie featuring [uploaded person] holding up a smartphone to take the photo and keep the original face. Surrounding him are the Justice League members — Superman, Batman, Wonder Woman, The Flash, Aquaman, and Cyborg — all smiling and posing casually like friends. The selfie has a fun, cheerful vibe, with everyone close together in frame, some characters leaning in playfully. Bright daylight, cinematic quality, natural colors, high detail.",
    "Tủ Kính Trưng Bày Cao Cấp": "The [upload persopn] is transformed into a realistic figurine. The figurine has a transparent base and is covered by a large glass panel. The background is a museum, with many people admiring the figurine. The overall scene is realistic, and the characters are rendered in a hyper-realistic style. The image quality is 4K high definition, with bright and layered lighting and rich, vibrant colors, creating the refined imaging effects of advanced photography. Visual Keynote: The image should be rich in color, the scene should be realistic, and the background elements should be detailed and vivid to create an immersive experience. The image should focus on full-body close-ups of the figurine.",
    "FrontFrame": "A creative scene of [uploaded person] standing at the front of the picture with full body. The background is blurred, showing only a close-up of person eyes. Those eyes seem to be looking directly at the viewer. The image is rendered in ultra-high 8K resolution, using advanced composition techniques and cinematic lighting effects. Every detail has been meticulously crafted to ensure outstanding image quality and rich details. The background should be kept soft and blurred to highlight the character’s striking eyes.",
    "9 FigureQ 3D Với Người Thật": "Make the pictures of [upload person] into cute 3D Q-version style figures in different poses, and place them neatly in the glass figure display cabinet in order, 3 rows and 3 columns, with a 3D figure in each grid. The characters in the pictures look at these figures happily sideways.",
    "Nhân Vật Năm 2025": "A 2025-style figure packaging, with a figure inside that fully recreates the character from the [uploaded image] to the figure retains the character’s signature outfit, iconic pose/expression, and unique details (such as accessories, hairstyle, clothing/facial textures). The figure adopts 2025-style colors and rich design details; the background is pure white with professional studio lighting, highlighting both the classic 2025 toy packaging elements (such as typography, prominent label areas, and product information panels) and the 3D details as well as the accurate recreation of the uploaded character’s features."
};

// Handle file processing from both drag-and-drop and click
function processFile(file: File) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                imagePreview.src = result;
                imagePreview.classList.remove('hidden');
                dropZoneContent.classList.add('hidden');

                // Store the image data and mime type for later use
                uploadedImageBase64 = result.split(',')[1];
                uploadedImageMimeType = file.type;
                updateButtonState();
            }
        };
        reader.readAsDataURL(file);
    } else {
        errorMessage.textContent = 'Vui lòng tải lên một tệp ảnh hợp lệ.';
        errorMessage.classList.remove('hidden');
    }
}

// --- Event listeners for drag and drop ---
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('active');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    const file = e.dataTransfer?.files[0];
    if (file) {
        processFile(file);
    }
});

// --- Event listeners for file input ---
dropZone.addEventListener('click', () => {
    imageUpload.click();
});

imageUpload.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        processFile(file);
    }
});

// --- Event listener for style selection ---
styleOptions.forEach(option => {
    option.addEventListener('click', () => {
        styleOptions.forEach(opt => {
             opt.classList.remove('ring-2', 'ring-offset-2', 'ring-cyan-400', 'ring-offset-gray-900');
        });

        option.classList.add('ring-2', 'ring-offset-2', 'ring-cyan-400', 'ring-offset-gray-900');
        
        selectedStyle = (option as HTMLElement).dataset.style ?? null;
        updateButtonState();
    });
});

// --- Update the state of the generate button ---
function updateButtonState() {
    generateButton.disabled = !(uploadedImageBase64 && selectedStyle);
}

// --- Event listener for the generate button ---
generateButton.addEventListener('click', async () => {
    if (!uploadedImageBase64 || !selectedStyle || !uploadedImageMimeType) {
        errorMessage.textContent = 'Vui lòng tải lên ảnh và chọn một phong cách.';
        errorMessage.classList.remove('hidden');
        return;
    }
    
    // Hide previous results and show loading status
    imageContainer.classList.add('hidden');
    errorMessage.classList.add('hidden');
    generateButton.disabled = true;
    buttonText.classList.add('opacity-0');
    buttonSpinner.classList.remove('hidden');

    // Show enhanced loading indicator
    loadingIndicator.classList.remove('hidden');
    progressBar.style.width = '0%'; // Reset first
    // Force a reflow to ensure the transition starts from 0
    void progressBar.offsetWidth; 
    progressBar.style.width = '95%';
    
    let messageIndex = 0;
    loadingMessage.textContent = loadingMessages[messageIndex];
    if (messageInterval) clearInterval(messageInterval);
    messageInterval = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        loadingMessage.textContent = loadingMessages[messageIndex];
    }, 3000); // Change message every 3 seconds

    try {
        const userPrompt = stylePrompts[selectedStyle];
        if (!userPrompt) {
            throw new Error('Phong cách không hợp lệ.');
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: uploadedImageBase64,
                    mimeType: uploadedImageMimeType,
                  },
                },
                {
                  text: userPrompt,
                },
              ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        let base64Data = null;
        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    base64Data = part.inlineData.data;
                    break;
                }
            }
        }

        if (base64Data) {
            const imageUrl = `data:image/png;base64,${base64Data}`;
            generatedImage.src = imageUrl;
            downloadButton.href = imageUrl;
            imageContainer.classList.remove('hidden');
        } else {
            console.error('API Response:', response);
            throw new Error('Không nhận được dữ liệu ảnh từ API.');
        }
    } catch (error) {
        console.error('Error generating image:', error);
        errorMessage.textContent = 'Đã xảy ra lỗi khi tạo ảnh. Vui lòng thử lại.';
        errorMessage.classList.remove('hidden');
    } finally {
        // Hide enhanced loading indicator
        loadingIndicator.classList.add('hidden');
        progressBar.style.width = '0%';
        if (messageInterval) clearInterval(messageInterval);

        // Re-enable the button and hide the spinner
        generateButton.disabled = false;
        buttonText.classList.remove('opacity-0');
        buttonSpinner.classList.add('hidden');
    }
});

// Set initial button state on page load
updateButtonState();