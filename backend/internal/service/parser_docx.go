package service

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"strconv"
	"strings"
)

type DOCXParser struct{}

func NewDOCXParser() *DOCXParser {
	return &DOCXParser{}
}

func (p *DOCXParser) Parse(ctx context.Context, data []byte) (*ParseResult, error) {
	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("open DOCX: %w", err)
	}

	// Find word/document.xml
	var docFile *zip.File
	for _, f := range reader.File {
		if f.Name == "word/document.xml" {
			docFile = f
			break
		}
	}
	if docFile == nil {
		return nil, fmt.Errorf("document.xml not found in DOCX")
	}

	rc, err := docFile.Open()
	if err != nil {
		return nil, fmt.Errorf("open document.xml: %w", err)
	}
	defer rc.Close()

	text, err := extractDocxMarkdown(rc)
	if err != nil {
		return nil, fmt.Errorf("extract text: %w", err)
	}

	return &ParseResult{
		Text: text,
	}, nil
}

// extractDocxMarkdown parses DOCX XML and outputs Markdown with heading levels,
// bold, and italic preserved.
func extractDocxMarkdown(r io.Reader) (string, error) {
	decoder := xml.NewDecoder(r)
	var paragraphs []string
	var currentPara strings.Builder
	inParagraph := false
	headingLevel := 0 // 0 = normal, 1-6 = heading level
	paraFontSize := 0 // half-points, from <w:sz> in <w:pPr><w:rPr>
	inRun := false
	runBold := false
	runItalic := false

	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			break
		}

		switch t := token.(type) {
		case xml.StartElement:
			switch t.Name.Local {
			case "p": // <w:p> paragraph start
				inParagraph = true
				currentPara.Reset()
				headingLevel = 0
				paraFontSize = 0

			case "pPr": // <w:pPr> paragraph properties
				if inParagraph {
					// Parse children for pStyle and sz
					parseParagraphProps(decoder, &headingLevel, &paraFontSize)
				}

			case "r": // <w:r> text run start
				if inParagraph {
					inRun = true
					runBold = false
					runItalic = false
				}

			case "rPr": // <w:rPr> run properties (bold, italic, font size)
				if inRun {
					parseRunProps(decoder, &runBold, &runItalic)
				}

			case "t": // <w:t> text content
				if inParagraph {
					var content string
					for {
						tok, err := decoder.Token()
						if err != nil {
							break
						}
						if char, ok := tok.(xml.CharData); ok {
							content += string(char)
						}
						if _, ok := tok.(xml.EndElement); ok {
							break
						}
					}
					if content != "" {
						// Apply inline formatting
						if runBold && runItalic {
							currentPara.WriteString("***" + content + "***")
						} else if runBold {
							currentPara.WriteString("**" + content + "**")
						} else if runItalic {
							currentPara.WriteString("*" + content + "*")
						} else {
							currentPara.WriteString(content)
						}
					}
				}

			case "br": // <w:br> line break within paragraph
				if inParagraph {
					currentPara.WriteString("  \n")
				}
			}

		case xml.EndElement:
			switch t.Name.Local {
			case "p": // paragraph end
				if inParagraph {
					inParagraph = false
					text := strings.TrimSpace(currentPara.String())
					if text == "" {
						continue
					}

					// If no explicit heading style, check font size fallback
					if headingLevel == 0 && paraFontSize > 0 {
						headingLevel = fontSizeToHeading(paraFontSize)
					}

					// Prepend heading markers
					if headingLevel > 0 {
						prefix := strings.Repeat("#", headingLevel)
						text = prefix + " " + text
					}

					paragraphs = append(paragraphs, text)
				}
			case "r": // run end
				inRun = false
			}
		}
	}

	return strings.Join(paragraphs, "\n\n"), nil
}

// parseParagraphProps reads children of <w:pPr> to extract heading style and font size.
func parseParagraphProps(decoder *xml.Decoder, headingLevel *int, fontSize *int) {
	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}

		switch t := token.(type) {
		case xml.StartElement:
			switch t.Name.Local {
			case "pStyle": // <w:pStyle w:val="Heading1"/>
				for _, attr := range t.Attr {
					if attr.Name.Local == "val" {
						*headingLevel = styleToHeading(attr.Value)
					}
				}
			case "rPr": // <w:rPr> inside <w:pPr> may contain <w:sz>
				parseRunPropsForSize(decoder, fontSize)
			}
		case xml.EndElement:
			if t.Name.Local == "pPr" {
				return
			}
		}
	}
}

// parseRunProps reads children of <w:rPr> to detect bold/italic.
func parseRunProps(decoder *xml.Decoder, bold *bool, italic *bool) {
	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}

		switch t := token.(type) {
		case xml.StartElement:
			switch t.Name.Local {
			case "b": // <w:b/> = bold
				// Check for w:val="false" (toggle off)
				val := getAttrVal(t.Attr)
				if val != "false" && val != "0" {
					*bold = true
				}
			case "i": // <w:i/> = italic
				val := getAttrVal(t.Attr)
				if val != "false" && val != "0" {
					*italic = true
				}
			}
		case xml.EndElement:
			if t.Name.Local == "rPr" {
				return
			}
		}
	}
}

// parseRunPropsForSize reads <w:rPr> children for font size only.
func parseRunPropsForSize(decoder *xml.Decoder, fontSize *int) {
	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}

		switch t := token.(type) {
		case xml.StartElement:
			if t.Name.Local == "sz" { // <w:sz w:val="48"/> (half-points)
				for _, attr := range t.Attr {
					if attr.Name.Local == "val" {
						if v, err := strconv.Atoi(attr.Value); err == nil && v > 0 {
							*fontSize = v
						}
					}
				}
			}
		case xml.EndElement:
			if t.Name.Local == "rPr" {
				return
			}
		}
	}
}

// styleToHeading maps DOCX style names to heading levels.
// Supports both English (Heading1) and Chinese (标题 1) style names.
func styleToHeading(styleVal string) int {
	styleVal = strings.TrimSpace(styleVal)

	// English: Heading1, Heading2, ..., Heading6
	if strings.HasPrefix(styleVal, "Heading") {
		suffix := styleVal[7:]
		if n, err := strconv.Atoi(suffix); err == nil && n >= 1 && n <= 6 {
			return n
		}
	}

	// Chinese: 标题 1, 标题 2, ..., 标题 6
	if strings.HasPrefix(styleVal, "标题") {
		suffix := strings.TrimSpace(styleVal[len("标题"):])
		if n, err := strconv.Atoi(suffix); err == nil && n >= 1 && n <= 6 {
			return n
		}
	}

	// heading 1, heading 2 (lowercase variant)
	lower := strings.ToLower(styleVal)
	if strings.HasPrefix(lower, "heading") {
		suffix := strings.TrimSpace(lower[7:])
		if n, err := strconv.Atoi(suffix); err == nil && n >= 1 && n <= 6 {
			return n
		}
	}

	return 0
}

// fontSizeToHeading maps font size (in half-points) to heading level as fallback.
// >= 24pt (48 half-pts) -> H1
// 18-23pt (36-46) -> H2
// 14-17pt (28-34) -> H3
// 12-13pt (24-26) -> H4
func fontSizeToHeading(halfPoints int) int {
	switch {
	case halfPoints >= 48:
		return 1
	case halfPoints >= 36:
		return 2
	case halfPoints >= 28:
		return 3
	case halfPoints >= 24:
		return 4
	default:
		return 0
	}
}

// getAttrVal returns the value of w:val attribute, or empty string.
func getAttrVal(attrs []xml.Attr) string {
	for _, attr := range attrs {
		if attr.Name.Local == "val" {
			return attr.Value
		}
	}
	return ""
}
