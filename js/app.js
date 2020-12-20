/* Variables */
function initVars() {   //le variabili vengono dichiarate senza keyword in modo che invocata initVars il loro scope sia globale

  //varie
  logo = new CircleType(document.getElementById("logo")).radius(600); //stilizzazione logo
  keyAPI = "99778220f31eec4fabbbe1461237e9d0";

  //contenitori
  mediaBox = $("#media_box");
  moviesBox = $("#movies");
  seriesBox = $("#tv-series");
  searchResultsBox = $("#search");
  favouritesBox = $("#favourites");
  genresFilterBox = $("#genres_list");
  pagination = $(".pagination");

  //bottoni
  headbarNavigationButtons = $(".headbar a");
  genresButton = $("#genre_button");
  searchButton = $("#go");
  page_switchers = $(".pagination button");
  
  //form
  searchInput = $("#searchInput");
  page_index = $(".page_index");

  //Application State 
  state = {
    movies: {
      totalPages: 1,
      currentPage: 1,
      data: [],
    },
    series: {
      totalPages: 1,
      currentPage: 1,
      data: [],
    },
    favs: {
      totalPages: 1,
      currentPage: 1,
      data: [],
      onPage: []
    },
    search: {
      query: null,
      totalPages: 1,
      currentPage: 1,
      data: [],
    },
    genres: []
  };

  handlestate = {
    set: (target, prop, value) => {
      target[prop] = value;
      if(prop === "favs") saveFavsToStorage();
      updateDOM(prop);
      return true;
    }
  };

  state = new Proxy(state, handlestate);    //proxy agisce come event listener sull'oggetto contenente lo stato -- ogni aggiornamento innesca updateDom()

  //Ajax Defaults
  ajaxDefaults = {
    url: 'https://api.themoviedb.org/3/',
    method: 'GET',
    data: {
      api_key: keyAPI,
      sort_by: "popularity.desc",
    }
  };

}
/* ---------- */

/* API Calls */
async function getMovies(page = 1) {

  const ajaxObject = {
    ...ajaxDefaults
  };
  ajaxObject.url += 'discover/movie';
  ajaxObject.data.page = page;
  
  const movies = await $.ajax(ajaxObject);

  state.movies = {
    totalPages: movies.total_pages,
    currentPage: page,
    data: movies.results
  }

}

async function getTVSeries(page = 1) {

  const ajaxObject = {
    ...ajaxDefaults
  };
  ajaxObject.url += "discover/tv";
  ajaxObject.data.page = page;

  const TVseries = await $.ajax(ajaxObject);

  state.series = {
    totalPages: TVseries.total_pages,
    currentPage: page,
    data: TVseries.results
  };

}

async function search(event, page = 1) {

  if (!searchInput.val().trim().length && event !== "page-change") return;

  const ajaxObject = {
    ...ajaxDefaults,
  };
  ajaxObject.url += "search/multi";
  ajaxObject.data.page = page;
  ajaxObject.data.query = (event === "page-change") ? state.search.query : searchInput.val().toLowerCase();

  const multi = await $.ajax(ajaxObject);

  state.search = {
    query: ajaxObject.data.query,
    totalPages: multi.total_pages,
    currentPage: page,
    data: multi.results,
  };
  
}

async function getGenres() {

  const ajaxObject = {
    ...ajaxDefaults,
  };

  const url = ajaxObject.url;

  ajaxObject.url = url + 'genre/movie/list?';
  const movie = (await $.ajax(ajaxObject));

  ajaxObject.url = url + "genre/tv/list?";
  const tv = (await $.ajax(ajaxObject));

  const genres = movie.genres.concat(tv.genres);

  const sortedGenres = [
    ...new Map(                                               // 0. genres [ {id: 35, name: 'Western'}, {id: 35, name: 'Western'} ] -- contiene duplicati
      genres.map( genreObj => [ genreObj['id'], genreObj ] )  // 1. .map => [ [id, {}], [id, {}], ..] -- riorganizza esponendo id
      )                                                       // 2. new Map => { id => {}, id => {}, ..} -- elimina duplicati | 3. .values() => { {}, {}, ..} -- espone valori
    .values()                                                 // 4. [...<values>] => [ {}, {}, ..] -- copia i valori in nuovo array
  ];

  state.genres = sortedGenres;
}
/* ------------- */

/* Favourites */
const getFavsFromStorage = (page = 1) => {
   
  const favourites = window.localStorage.getItem("favourites") ? JSON.parse(window.localStorage.getItem("favourites")) : [],
        filter = Number(ajaxDefaults.data.with_genres),
        eventuallyFilteredFavourites = (filter) ? favourites.filter( (fav) => fav.genre_ids.includes(filter)) : favourites,
        resultsPerPage = 20,
        totalPages = Math.ceil(eventuallyFilteredFavourites.length / resultsPerPage),
        first = (page - 1) * resultsPerPage,
        last = first + resultsPerPage;

  state.favs = {
    totalPages: totalPages,
    currentPage: page,
    data: favourites,
    onPage: eventuallyFilteredFavourites.slice(first, last),
  };
    
};

function add_n_remove_Favs() {

  const thisBookmark = $(this),
        thisMedia = $(this).parents(".media"),
        thisMediaID = thisMedia.data('id'),
        thisMediaIsBookmarked = thisBookmark.hasClass("active"),
        thisMediaBox = thisMedia.parent().siblings(".pagination").data("box");

  let updatedFavs;

  if(thisMediaIsBookmarked) {
    $(".media").each( function() { if( $(this).data('id') === thisMediaID) $(this).find(".bookmark").removeClass("active") } );
    updatedFavs = state.favs.data.filter((fav) => fav.id !== thisMediaID);
    recalculateFavs(updatedFavs);
  } 
  else {
    thisBookmark.addClass("active");
    updatedFavs = state[thisMediaBox].data.find((elm) => elm.id === thisMediaID);
    recalculateFavs(state.favs.data.concat(updatedFavs));
  }

}

const recalculateFavs = (favs) => {

  const resultsPerPage = 20,
        filter = ajaxDefaults.data.with_genres,
        eventuallyFilteredFavourites = (filter) ? favs.filter( (fav) => fav.genre_ids.includes(filter)) : favs,
        totalPages = Math.ceil(eventuallyFilteredFavourites.length / resultsPerPage) || 1,
        page = (state.favs.currentPage <= totalPages) ? state.favs.currentPage : totalPages,
        first = (page - 1) * resultsPerPage,
        last = first + resultsPerPage;

  state.favs = {
    totalPages: totalPages,
    currentPage: page,
    data: favs,
    onPage: eventuallyFilteredFavourites.slice(first, last),
  };

};

const saveFavsToStorage = () => {
  window.localStorage.setItem("favourites", JSON.stringify(state.favs.data));
};
/* -------- */

/* DOM Update */
const updateDOM = (prop) => {

  switch (prop) {
    case "movies":
      injectTemplates("media", state.movies.data, moviesBox);
      paintPagesIndex(prop);
      paintBookmarks(moviesBox);
      console.log("DOM UPDATE", { movies: state.movies });
      break;

    case "series":
      injectTemplates("media", state.series.data, seriesBox);
      paintPagesIndex(prop);
      paintBookmarks(seriesBox);
      console.log("DOM UPDATE", { series: state.series });
      break;

    case "search":
      injectTemplates("media", state.search.data, searchResultsBox);
      paintPagesIndex(prop);
      paintBookmarks(searchResultsBox);
      scrollTo("search");
      displayCurrentSearch();
      console.log("DOM UPDATE", { search: state.search });
      break;

    case "favs":
      injectTemplates("media", state.favs.onPage, favouritesBox);
      paintPagesIndex(prop);
      paintBookmarks(favouritesBox);
      console.log("DOM UPDATE", { favs: state.favs });
      break;

    case "genres":
      injectTemplates("genres", state.genres, genresFilterBox);
      console.log("DOM UPDATE", { genres: state.genres });
      break;
  }

};


const injectTemplates = (kind, data, targetBox) => {

  let template;

  switch (kind) {
    case "media":
      template = Handlebars.compile($("#template_media").html());

      targetBox.html("");

      for (const media of data) {
        const checkDate = media.first_air_date ?? media.release_date;

        const context = {
          id: media.id,
          cover: displayCover(media.poster_path),
          title: media.name ?? media.title,
          originalTitle: media.original_name ?? media.original_title,
          flag: displayLanguage(media.original_language, "img"),
          language: displayLanguage(media.original_language, "txt"),
          score: rateIt(media.vote_average),
          overview: media.overview,
          genreData: media.genre_ids,
          genres: translateGenres(media.genre_ids),
          year: checkDate ? checkDate.substring(0, 4) : "n.d.",
          category: (media.title) ? "MOVIE" : "TV"           //film hanno sempre una prop title, le serie una name - per evitare di passare altri parametri a inject
        };

        targetBox.append(template(context));
      }
      break;

    case "genres":
      template = Handlebars.compile($("#template_genreFilter_options").html());

      for (const genre of data) {
        const context = {
          genreName: genre.name,
          genreCode: genre.id,
        };

        targetBox.append(template(context));
      }
      break;
  }

};

const paintPagesIndex = (box) => {
    const pageIndex = page_index.filter( function() { return $(this).parent().data("box") === box } ),
          dataIsNotMissing = (state[box].data.length > 0) ? true : false,  
          totalPages = state[box].totalPages || 1,
          currentPage = state[box].currentPage;

    pageIndex.html("");

    if(dataIsNotMissing) {
      pageIndex.after().append(`<input type="number" name="page" min="1" max="${totalPages}" value="${currentPage}" />`);
      pageIndex.after().append(`<span>- ${totalPages}</span>`);
    }
};

const paintBookmarks = (box) => {

  box.children().each(function () {
    for (let media of state.favs.data) 
      if (media.id === $(this).data("id"))  $(this).find(".bookmark").addClass("active");
  });
};

const displayCurrentSearch = () => {
  const placeholder = `Results for: "${state.search.query}"`;
  searchInput.attr("placeholder", placeholder);
}
/* --- */

/* Media Info Templating Utilities */
const displayLanguage = (language, mode) => {

  const toFlag = {
    it: "img/it.png",
    gb: "img/gb.png",
    en: "img/en.png",
    us: "img/us.png",
    fr: "img/fr.png",
    de: "img/de.png",
    es: "img/es.png",
    pt: "img/pt.png",
    cn: "img/zh.png",
    ru: "img/ru.png",
    ja: "img/ja.png",
    zh: "img/zh.png"
  };

  if (mode == "img") return toFlag[language] || "";
  else if (mode == "txt") return (toFlag[language] === undefined) ? language : "";
};

const rateIt = (vote) => {

  const starredVote = (vote == 0) ? 1 : Math.round(vote / 2);
  let starString = "";

  for (let stars = 0; stars < 5; stars++) {
    if (stars < starredVote)  starString += "<i class='fas fa-star'></i>";
    else  starString += "<i class='far fa-star'></i>";
  }

  return starString;
};

const displayCover = (coverPath) => {
  return (coverPath) ? `https://image.tmdb.org/t/p//w500/${coverPath}` : "img/no_image.jpeg";
};

const translateGenres = (mediaGenreCodes = []) => {
  
  const genresTable = state.genres;
  let genresList = [];

  for(let e = 0; e < mediaGenreCodes.length; e++) {
    let code = mediaGenreCodes[e];
    for(let i = 0; i < genresTable.length; i++) {
      if(code === genresTable[i].id) {
        genresList.push(genresTable[i].name);
        break;
      }
    }
  }

  return genresList.join(' ') || 'n.d.';
};
/* ------------- */

/* Pagination */
function browsePages() {
  
  const box = $(this).parent().data("box"),
        direction = $(this).attr("class"),
        currentPage = state[box].currentPage,
        total_pages = state[box].totalPages,
        nextPage = direction === "page-up" ? currentPage + 1 : currentPage - 1;

  if (direction === "page-up" && currentPage < total_pages || direction === "page-down" && currentPage > 1) {
    switch (box) {
      case 'movies':
        getMovies(nextPage);
      break;
  
      case 'series':
        getTVSeries(nextPage);
      break;
  
      case 'favs':
        getFavsFromStorage(nextPage);
      break;
  
      case 'search':
        search("page-change", nextPage);
      break;
    }
  }
}

function goToPage(e) {

  e.preventDefault();

  const box = $(this).parent().data("box"),
        nextPage = Number($(this).find("input[name='page']").val());

  switch (box) {
    case "movies":
      getMovies(nextPage);
    break;

    case "series":
      getTVSeries(nextPage);
    break;

    case "favs":
      getFavsFromStorage(nextPage);
    break;

    case "search":
      search("page-change", nextPage);
    break;
  }

  return false;
}
/* ------------ */

/* Filters */
function filterForGenre() {

  const filter = $(this).val();
  if(filter === "all")  delete ajaxDefaults.data.with_genres;
  else  ajaxDefaults.data.with_genres = filter;

  getMovies();
  getTVSeries();
  getFavsFromStorage();
}
/* -------- */

/* Navigation */
function headbarNavigation() {

  headbarNavigationButtons.each(function () {
    $(this).removeClass('active');
  });

  $(this).addClass('active');
}

function scrollbarHeadbarSync() {      

  const at = mediaBox.scrollTop();

  headbarNavigationButtons.each(function () {
    $(this).removeClass('active');
  });

  if (at <= 697) headbarNavigationButtons.eq(0).addClass('active');
  else if (at >= 698 && at <= 1305) headbarNavigationButtons.eq(1).addClass('active');
  else if (at >= 1306 && at <= 1747) headbarNavigationButtons.eq(2).addClass('active');
  else  headbarNavigationButtons.eq(3).addClass('active');
}

const scrollTo = (hash) => {
  location.hash = null;
  location.hash = hash;
};
/* ---------- */

/* On Start */
const setup = () => {
  getGenres().then( () => {
    getFavsFromStorage();
    getMovies();
    getTVSeries();
  });
};
/* ----- */

/* App */
const Boolflix = () => {

  initVars();     //per organizzare meglio il codice, le variabili vengono dichiarate all'interno di initVars

  setup();

  /* Listeners */
  page_index.submit(goToPage);
  page_switchers.click(browsePages);

  genresButton.click(() => {
    genresButton.toggleClass("active");
    genresFilterBox.toggle();
    genresFilterBox.click(filterForGenre);
  });

  mediaBox.on("click", ".bookmark", add_n_remove_Favs);

  searchButton.click(search);

  searchInput.on({
    focusin: () => {
      searchInput.val("");
    },
    focusout: () => {
      setTimeout( () => searchInput.val(""), 200)
    },
    keydown: (e) => {
      if (e.which == 13) {
        e.preventDefault();
        document.getElementById("searchInput").blur();
        search();
      }
    },
  });

  headbarNavigationButtons.click(headbarNavigation);
  mediaBox.scroll(scrollbarHeadbarSync);
 /* ------- */

};
/* --- */
$(document).ready(Boolflix);