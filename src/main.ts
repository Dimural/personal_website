import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/hero.css";
import "./styles/library.css";
import { mountLibrary } from "./library";
import { installDebug } from "./library/debug";

const library = document.querySelector<HTMLElement>("#library");
if (library) mountLibrary(library);

installDebug(() => ({
  mode: "shelf",
  bay: "experience",
  selectedIndex: 0,
  readingOpen: false,
  spread: 0,
  bookCount: 0,
  ready: true,
}));
