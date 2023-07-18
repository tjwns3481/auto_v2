const express = require("express");
const multer = require("multer");
const app = express();
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const desktopPath = path.join(__dirname, "uploads");

// Set file name
const date = new Date();
const fullYear = date.getFullYear();
const realYear = fullYear.toString().slice(2);
const month = date.getMonth() + 1;
let realMonth = "";
const day = date.getDate();
const realDay = day.toString().padStart(2, "0");
month < 10 ? (realMonth = "0" + month) : (realMonth = month.toString());
const realDate = realYear + realMonth + realDay;

let extName = [];
let osTypes = ["app", "pc", "kiosk"];
let newHtmlLink = ``;
let newHtmlImg = ``;

app.use(express.static(path.join(__dirname, "public"))); // Serve static files from the 'public' directory
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
osTypes.forEach((t) => {
  // Set ready dir
  const dirPath = path.join(desktopPath, `html_${realDate}sn_${t}`);

  fs.mkdirSync(dirPath, { recursive: true });
  fs.mkdirSync(path.join(dirPath, "css"), { recursive: true });
  fs.mkdirSync(path.join(dirPath, "images"), { recursive: true });
  fs.mkdirSync(path.join(dirPath, "js"), { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const folderPath = path.join(dirPath, "images");
      fs.mkdirSync(folderPath, { recursive: true });
      cb(null, folderPath);
    },
    filename: (req, file, cb) => {
      extName.push(path.extname(file.originalname));
      cb(null, "img" + req.files.length + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage: storage });

  app.post(`/download_${t}`, upload.array("image"), (req, res) => {
    newHtmlLink = ""; //linkSetting 초기화
    newHtmlImg = "";
    const linkId = req.query.linkId.split("");
    const normalId = req.query.normalTypeIdx.split("");
    const total = linkId.length + normalId.length;

    if (t !== "kiosk") {
      //linkSetting
      if (linkId.length < 2) {
        newHtmlLink = `LinkSetting("link1", "${req.body.linkType}", "yes", "${req.body.linkUrl}");`; //linkId 의 값이 한개일때
      } else {
        linkId.map((item, idx) => {
          newHtmlLink += `LinkSetting("link${item}", "${req.body.linkType[idx]}", "yes", "${req.body.linkUrl[idx]}");
        `; //linkId 의 값이 여러개일때
        });
      }
    }

    for (let i = 0; i < total; i++) {
      if (t !== "kiosk") {
        linkId.map((item, idx) => {
          if (i == item) {
            newHtmlImg += `
      <a href="#none" id="link${i}">
        <img src="./images/img${i + 1}${extName[0]}"/>
      </a>
`;
          }
        });
      }

      normalId.map((item, idx) => {
        if (i == item) {
          newHtmlImg += `
      <div class="img_box">
        <img src="./images/img${i + 1}${extName[0]}"/>
      </div>
`;
        }
      });
    }

    const newHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no"
        />
        <meta name="format-detection" content="telephone=no" />
        <title>이벤트</title>
    
        <link rel="stylesheet" href="./css/event.css" />
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
        <script src="./js/link.js"></script>
        <script>
          $(document).ready(function () {
            ${newHtmlLink}
          });
      </script>
      </head>
      <body>
        <div class="canvas">
          <div class="container">
            <div class="eventBox">
              <div class="img_box">
                ${newHtmlImg}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;
    const newCss = `
    html, body, div, span, applet, object, iframe,
    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
    a, abbr, acronym, address, big, cite, code,
    del, dfn, em, img, ins, kbd, q, s, samp,
    small, strike, strong, sub, sup, tt, var,
    b, u, i, center,
    dl, dt, dd, ol, ul, li,
    fieldset, form, label, legend,
    table, caption, tbody, tfoot, thead, tr, th, td,
    article, aside, canvas, details, embed, 
    figure, figcaption, footer, header, hgroup, 
    menu, nav, output, ruby, section, summary,
    time, mark, audio, video {margin: 0;padding: 0;border: 0;font-size: 100%;font: inherit;vertical-align: baseline;}
    /* HTML5 display-role reset for older browsers */
    article, aside, details, figcaption, figure, 
    footer, header, hgroup, menu, nav, section {display: block;}
    body {line-height: 1;}
    ol, ul {list-style: none;}
    blockquote, q {quotes: none;}
    blockquote:before, blockquote:after,
    q:before, q:after {content: '';content: none;}
    table {border-collapse: collapse;border-spacing: 0;}
    .eventBox {width:100%; overflow-x:hidden;}
    img{width:100%; display:block}
    #link1 {display:block;}
    `;
    const newJs = `function LinkSetting(obj, type, newWindow, link_val) {
      var filter = "win16|win32|win64|mac|macintel";
    
      var pcweb_url = "";
      var moweb_url = "";
      var app_url = "";
    
      if (type == "coupon") {
        pcweb_url = "https://www.lotteshopping.com/cpn/cpnDetail?cpnInfoNo=";
        moweb_url = "https://m.lotteshopping.com/cpn/cpnDetail?cpnInfoNo=";
        app_url = "lottecoupon://gate?page=a0026&cpnInfoNo=";
      } else if (type == "shopping") {
        pcweb_url =
          "https://www.lotteshopping.com/shpgnews/shpgnewsDetail?shpgNewsNo=";
        moweb_url =
          "https://m.lotteshopping.com/shpgnews/shpgnewsDetail?shpgNewsNo=";
        app_url = "lottecoupon://gate?page=a0083&shpgNewsNo=";
      } else if (type == "saeun") {
        pcweb_url = "https://www.lotteshopping.com/thku/thkuDetail?thkuNo=";
        moweb_url = "https://m.lotteshopping.com/thku/thkuDetail?thkuNo=";
        app_url = "lottecoupon://gate?page=a0065&thkuNo=";
      } else if (type == "event") {
        pcweb_url = "https://www.lotteshopping.com/cuterent/cuterentDetail?entNo=";
        moweb_url = "https://m.lotteshopping.com/cuterent/cuterentDetail?entNo=";
        app_url = "lottecoupon://gate?page=a0102&entNo=";
      } else if (type == "magazine") {
        pcweb_url =
          "https://www.lotteshopping.com/magazine/magazineDetail?mazinNo=";
        moweb_url = "https://m.lotteshopping.com/magazine/magazineDetail?mazinNo=";
        app_url = "lottecoupon://gate?page=a0086&mazinNo=";
      } else if (type == "BrowserOpen") {
        pcweb_url = "";
        moweb_url = "";
        app_url = "toapp:::AppViewMove:::BrowserOpen:::";
      } else if (type == "xBrowser") {
        pcweb_url = "";
        moweb_url = "";
        app_url = "lottecoupon://gate?page=a0137&url=";
      }
    
      if (newWindow != "yes" || newWindow != "no") {
        newWindow = "yes";
      }
    
      if (navigator.platform) {
        if (filter.indexOf(navigator.platform.toLowerCase()) >= 0) {
          // PCWEB 인 경우
          $("#" + obj).prop("href", pcweb_url + link_val);
          if (newWindow == "yes") {
            $("#" + obj).prop("target", "_blank");
          }
        } else {
          var browserInfo = navigator.userAgent;
          var isInIFrame = window.location != window.parent.location;
    
          if (
            browserInfo.indexOf("LD_Android") > -1 ||
            browserInfo.indexOf("LD_iOS") > -1
          ) {
            // 앱 링크
            $("#" + obj).prop("href", app_url + link_val);
          } else {
            // 모바일 웹 링크
            $("#" + obj).prop("href", moweb_url + link_val);
            if (newWindow == "yes") {
              $("#" + obj).prop("target", "_blank");
            }
          }
        }
      }
    }
    `;

    // Write the new HTML file
    fs.writeFile(`${desktopPath}/html_${realDate}sn_${t}/index.html`, newHtml, (err) => {
      if (err) {
        console.err;
      } else {
        return;
      }
    });

    // Write the new CSS file
    fs.writeFile(`${desktopPath}/html_${realDate}sn_${t}/css/event.css`, newCss, (err) => {
      if (err) {
        console.err;
      } else {
        return;
      }
    });

    // Write the new JS file
    fs.writeFile(`${desktopPath}/html_${realDate}sn_${t}/js/link.js`, newJs, (err) => {
      if (err) {
        console.err;
      } else {
        return;
      }
    });

    const folderPath = path.join(desktopPath + `/html_${realDate}sn_${t}`);

    if (!fs.existsSync(folderPath)) {
      return res.status(404).send("Folder not Found");
    }

    const archive = archiver("zip", {
      zlib: { level: 7 },
    });

    archive.on("error", (err) => {
      res.status(500).send({ error: err.message });
    });

    archive.on("end", () => {
      console.log("압축완료");
      res.end();
    });

    res.attachment(`html_${realDate}sn_${t}.zip`);
    res.setHeader("Content-Type", "application/zip");

    archive.pipe(res);

    archive.directory(folderPath, false);

    archive.finalize();
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
