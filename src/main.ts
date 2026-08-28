import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/hero.css";
import "./styles/library.css";
import { mountLibrary } from "./library";

const library = document.querySelector<HTMLElement>("#library");
if (library) mountLibrary(library);
