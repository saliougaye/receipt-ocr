import axios from "axios";
import {Telegraf} from "telegraf";
import {message} from "telegraf/filters";
import {createWorker} from "tesseract.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on(message("photo"), async (ctx) => {
	const photos = ctx.message.photo;
	const highestResPhoto = photos[photos.length - 1];

	const file = await ctx.telegram.getFile(highestResPhoto.file_id);
	const filePath = file.file_path;

	const fileUrl = `https://api.telegram.org/file/bot${bot.telegram.token}/${filePath}`;

	const response = await axios({
		url: fileUrl,
		method: "GET",
		responseType: "arraybuffer",
	});

	const imageBuffer = Buffer.from(response.data, "binary");

	const text = await readReceipt(imageBuffer, ctx.from.language_code);

	ctx.reply(text);
});

bot.start((ctx) =>
	ctx.reply(
		"Welcome to ReceiptOCR, a bot that translate your Receipt into a text that can you copy"
	)
);

bot.help((ctx) => {
	ctx.reply("Send me the receipt");
});

bot.launch(() => {
	console.log("Bot started...");
});

const readReceipt = async (receipt: Buffer, language: string | undefined) => {
	const worker = await createWorker([
		{
			code: language ?? "eng",
			data: null,
		},
	]);

	const ret = await worker.recognize(receipt);

	await worker.terminate();

	return ret.data.text;
};

process.once("SIGINT", async () => {
	bot.stop("SIGINT");
});
process.once("SIGTERM", () => bot.stop("SIGTERM"));
