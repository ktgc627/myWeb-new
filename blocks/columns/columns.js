export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Convert data-id to id on the section
  const section = block.closest(".section");
  if (section && section.dataset.id && !section.id) {
    section.id = section.dataset.id;
  }

  // your existing logic for image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector("picture");
      if (pic) {
        const picWrapper = pic.closest("div");
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add("columns-img-col");
        }
      }
    });
  });
}
