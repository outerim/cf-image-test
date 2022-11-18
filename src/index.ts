export interface Env {
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		url.search = "3"

		let opts: RequestInitCfProperties = {}

		if (/^\/resized/.test(url.pathname)) {
			url.pathname = url.pathname.replace("resized", "original")
			opts.image = { width: 750, fit: "contain", dpr: 1.5 }
			opts.cacheTags = ["optimized-images"]

			// I know we'd normally do content negotiation here.
			// This is just a test, use a modern browser
			if (/lossy/.test(url.pathname)) {
				opts.image.quality = 85
				opts.image.format = "avif"
			} else if (/lossless/.test(url.pathname)) {
				opts.image.quality = 100
				opts.image.format = "webp"
			}

			console.log(opts)
			return await fetch(url.toString(), { cf: opts })
		} else if (/^\/original/.test(url.pathname)) {
			// Original images don't change, cache em indefinitely
			opts.cacheTtl = 60 * 60 * 24 * 365
			// Theoretically cache without query string, protocol, or any other headers source images don't vary
			opts.cacheKey = url.host + url.pathname
			opts.cacheTags = ["source-images"]
			url.pathname = url.pathname.replace("/original", "")
			url.host = "bc-img-test.s3.us-west-001.backblazeb2.com"

			console.log(opts)
			return await fetch(url.toString(), { cf: opts })
		} else {
			return new Response(pageContent(), { headers: { "Content-Type": "text/html" } })
		}
	}
};

export function pageContent(): string {
	const content = `
<!DOCTYPE html>
<!-- Created By CodingNepal -->
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title>Image Comparison Slider | CodingNepal</title>
    <style>
      *{
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html,body{
        display: grid;
        height: 100%;
        place-items: center;
        background: #efefef;
      }
      .wrapper{
        position: relative;
        height: 500px;
        width: 750px;
        overflow: hidden;
        background: #fff;
        border: 7px solid #fff;
        box-shadow: 0px 0px 15px rgba(0,0,0,0.15);
      }
      .wrapper .images{
        height: 100%;
        width: 100%;
        display: flex;
      }
      .wrapper .images .img-1{
        height: 100%;
        width: 100%;
	background-repeat: no-repeat;
	background-size: 750px;
        /* background: url("images/car.jpg") no-repeat; */
      }
      .wrapper .images .img-2{
        position: absolute;
        height: 100%;
        width: 50%;
	background-repeat: no-repeat;
	background-size: 750px;
        /* filter: blur(5px); */
        /* background: url("images/car.png") no-repeat; */
      }
      .wrapper .slider{
        position: absolute;
        top: 0;
        width: 100%;
        z-index: 99;
      }
      .wrapper .slider input{
        width: 100%;
        outline: none;
        background: none;
        -webkit-appearance: none;
      }
      .slider input::-webkit-slider-thumb{
        height: 486px;
        width: 3px;
        background: none;
        -webkit-appearance: none;
        cursor: col-resize;
      }
      .slider .drag-line{
        width: 3px;
        height: 486px;
        position: absolute;
        left: 49.85%;
        pointer-events: none;
      }
      .slider .drag-line::before,
      .slider .drag-line::after{
        position: absolute;
        content: "";
        width: 100%;
        height: 222px;
        background: #fff;
      }
      .slider .drag-line::before{
        top: 0;
      }
      .slider .drag-line::after{
        bottom: 0;
      }
      .slider .drag-line span{
        height: 42px;
        width: 42px;
        border: 3px solid #fff;
        position: absolute;
        top: 50%;
        left: 50%;
        border-radius: 50%;
        transform: translate(-50%, -50%);
      }
      .slider .drag-line span::before,
      .slider .drag-line span::after{
        position: absolute;
        content: "";
        top: 50%;
        border: 10px solid transparent;
        border-bottom-width: 0px;
        border-right-width: 0px;
        transform: translate(-50%, -50%) rotate(45deg);
      }
      .slider .drag-line span::before{
        left: 40%;
        border-left-color: #fff;
      }
      .slider .drag-line span::after{
        left: 60%;
        border-top-color: #fff;
      }
    </style>
  </head>
  <body>
    AVIF lossy Demo
    <div class="wrapper">
      <div class="images">
        <div class="img-1" data-src="/original/lossy-a.jpg"></div>
        <div class="img-2" data-src="/resized/lossy-a.jpg"></div>
      </div>
      <div class="slider">
        <div class="drag-line">
          <span></span>
        </div>
        <input type="range" min="0" max="100" value="50">
      </div>
    </div>
    webp lossless Demo
    <div class="wrapper">
      <div class="images">
        <div class="img-1" data-src="/original/lossless-a.png"></div>
        <div class="img-2" data-src="/resized/lossless-a.png"></div>
      </div>
      <div class="slider">
        <div class="drag-line">
          <span></span>
        </div>
        <input type="range" min="0" max="100" value="50">
      </div>
    </div>
    <script>
      document.querySelectorAll(".img-1, .img-2").forEach(function(img) {
        img.style.backgroundImage = 'url("' + img.dataset.src + '")';
      });
      document.querySelectorAll(".wrapper").forEach(function(wrap) {
        const slider = wrap.querySelector(".slider input");
        const img = wrap.querySelector(".images .img-2");
        const dragLine = wrap.querySelector(".slider .drag-line");
        slider.oninput = ()=>{
          let sliderVal = slider.value;
          dragLine.style.left = sliderVal + "%";
          img.style.width = sliderVal + "%";
        }
      });
    </script>
  </body>
</html>`

	return content
}
