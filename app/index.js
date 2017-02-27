var test = document.getElementById('test');

window.onload = async(e) => {
  let origin = window.location.origin;
  let req = new Request(`${ origin }/templates`);
  let res = await window.fetch(req);
  let json = await res.json();

  let defaultTemplate = await (await window.fetch(`${ origin }/templates/default`)).json();

  test.textContent = JSON.stringify(defaultTemplate, null, 2);
}
