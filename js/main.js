(() => {
  const config = window.VIDYUTSPANDA_CONFIG || {};
  const currentPage = document.body.dataset.page;
  const currentFile = window.location.pathname.split("/").pop().toLowerCase() || (currentPage === "home" ? "index.html" : `${currentPage}.html`);

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.getAttribute("href").toLowerCase() === currentFile) {
      link.setAttribute("aria-current", "page");
    }
  });

  document.querySelectorAll("[data-event-dates]").forEach((element) => {
    if (config.eventDatesLabel) {
      element.textContent = config.eventDatesLabel;
    }
  });

  document.querySelectorAll("[data-event-config]").forEach((element) => {
    const configuredValue = config[element.dataset.eventConfig];
    if (typeof configuredValue === "string" && configuredValue.trim()) {
      element.textContent = configuredValue;
    }
  });

  const registrationButtons = document.querySelectorAll("[data-registration-trigger]");
  const registrationUrl = typeof config.registrationUrl === "string" ? config.registrationUrl.trim() : "";
  const isPlaceholderUrl = !registrationUrl || registrationUrl.includes("PASTE_GOOGLE_FORM_URL_HERE");
  let isGoogleFormUrl = false;

  if (!isPlaceholderUrl) {
    try {
      const parsedUrl = new URL(registrationUrl);
      isGoogleFormUrl = parsedUrl.protocol === "https:" && (
        (parsedUrl.hostname === "docs.google.com" && parsedUrl.pathname.startsWith("/forms/")) ||
        (parsedUrl.hostname === "forms.gle" && parsedUrl.pathname.length > 1)
      );
    } catch {
      isGoogleFormUrl = false;
    }
  }

  registrationButtons.forEach((button) => {
    const registrationStatus = document.getElementById(button.dataset.registrationMessage);

    if (isGoogleFormUrl && registrationStatus) {
      registrationStatus.textContent = "The official Google Form is ready.";
    }

    button.addEventListener("click", () => {
      if (isGoogleFormUrl) {
        window.location.assign(registrationUrl);
        return;
      }

      if (registrationStatus) {
        registrationStatus.textContent = "The official registration form is not configured yet. Please check back soon.";
        registrationStatus.classList.remove("visually-hidden");
      }
    });
  });

  const sponsorShowcase = document.querySelector("[data-sponsor-showcase]");
  const sponsorCategories = Array.isArray(config.sponsorCategories) ? config.sponsorCategories : [];
  const allowedSponsorCategories = new Set(sponsorCategories);
  const confirmedSponsors = Array.isArray(config.sponsors)
    ? config.sponsors.filter((sponsor) => sponsor && sponsor.confirmed === true && typeof sponsor.name === "string" && sponsor.name.trim() && allowedSponsorCategories.has(sponsor.category))
    : [];
  const previewSponsors = config.sponsorPreviewMode === true && window.location.protocol === "file:" && confirmedSponsors.length === 0 && Array.isArray(config.sponsorPreviewRecords)
    ? config.sponsorPreviewRecords.filter((sponsor) => sponsor && sponsor.previewOnly === true && sponsor.confirmed === false && typeof sponsor.name === "string" && sponsor.name.trim() && allowedSponsorCategories.has(sponsor.category))
    : [];
  const displayedSponsors = confirmedSponsors.length > 0 ? confirmedSponsors : previewSponsors;
  const showingSponsorPreview = confirmedSponsors.length === 0 && previewSponsors.length > 0;

  const getLocalLogoPath = (path) => {
    if (typeof path !== "string" || !path.trim()) {
      return "";
    }

    const normalizedPath = path.trim();
    const pathSegments = normalizedPath.split(/[?#]/)[0].split(/[\\/]/);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i.test(normalizedPath) || pathSegments.includes("..")) {
      return "";
    }

    return normalizedPath;
  };

  const getSafeSponsorWebsite = (website) => {
    if (typeof website !== "string" || !website.trim()) {
      return "";
    }

    try {
      const parsedUrl = new URL(website.trim());
      return parsedUrl.protocol === "https:" && parsedUrl.hostname && !parsedUrl.username && !parsedUrl.password ? parsedUrl.href : "";
    } catch {
      return "";
    }
  };

  const createSponsorLogo = (sponsor, featured) => {
    const logoSlot = document.createElement("div");
    logoSlot.className = featured ? "sponsor-logo-slot sponsor-logo-slot-featured" : "sponsor-logo-slot";

    const logoPath = getLocalLogoPath(sponsor.logo);
    if (logoPath) {
      const image = document.createElement("img");
      image.className = "sponsor-logo";
      image.src = logoPath;
      image.alt = `${sponsor.name.trim()} logo`;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => {
        image.remove();
        logoSlot.classList.add("is-empty");
      }, { once: true });
      logoSlot.append(image);
    } else {
      logoSlot.classList.add("is-empty");
    }

    const placeholder = document.createElement("span");
    placeholder.className = "sponsor-logo-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.textContent = "LOGO FILE NOT PROVIDED";
    logoSlot.append(placeholder);
    return logoSlot;
  };

  const createSponsorCard = (sponsor, featured = false, preview = false) => {
    const website = getSafeSponsorWebsite(sponsor.website);
    const card = document.createElement(website ? "a" : "article");
    card.className = featured ? "title-sponsor-panel glass-panel reveal-on-scroll" : "sponsor-card glass-panel reveal-on-scroll";

    if (website) {
      card.href = website;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.setAttribute("aria-label", `Visit ${sponsor.name.trim()} website (opens in a new tab)`);
    }

    if (featured) {
      const categoryLabel = document.createElement("p");
      categoryLabel.className = "sponsor-category-label";
      categoryLabel.textContent = preview ? "SAMPLE PREVIEW · NOT CONFIRMED / TITLE SPONSOR" : "TITLE SPONSOR";
      card.append(categoryLabel);
    } else {
      const categoryLabel = document.createElement("p");
      categoryLabel.className = "sponsor-card-category";
      categoryLabel.textContent = preview ? `SAMPLE PREVIEW · NOT CONFIRMED / ${sponsor.category}` : sponsor.category;
      card.append(categoryLabel);
    }

    card.append(createSponsorLogo(sponsor, featured));

    const details = document.createElement("div");
    details.className = "sponsor-card-details";
    const name = document.createElement(featured ? "h3" : "h4");
    name.textContent = sponsor.name.trim();
    details.append(name);

    if (typeof sponsor.description === "string" && sponsor.description.trim()) {
      const description = document.createElement("p");
      description.textContent = sponsor.description.trim();
      details.append(description);
    }

    card.append(details);
    return card;
  };

  if (sponsorShowcase && displayedSponsors.length > 0) {
    const emptyState = sponsorShowcase.querySelector("[data-sponsor-empty]");
    if (emptyState) {
      emptyState.remove();
    }

    if (showingSponsorPreview) {
      const previewNotice = document.createElement("p");
      previewNotice.className = "sponsor-preview-notice";
      previewNotice.textContent = "LOCAL PREVIEW ONLY · SAMPLE ENTRIES · NOT CONFIRMED SPONSORS";
      sponsorShowcase.append(previewNotice);
    }

    const sortedSponsors = [...displayedSponsors].sort((first, second) => {
      const firstPriority = Number.isFinite(first.displayPriority) ? first.displayPriority : 0;
      const secondPriority = Number.isFinite(second.displayPriority) ? second.displayPriority : 0;
      return firstPriority - secondPriority;
    });

    const titleSponsor = sortedSponsors.find((sponsor) => sponsor.category === "Title Sponsor");
    if (titleSponsor) {
      const titleGroup = document.createElement("div");
      titleGroup.className = "title-sponsor-group reveal-stagger";
      titleGroup.setAttribute("aria-label", "Title Sponsor");
      titleGroup.append(createSponsorCard(titleSponsor, true, showingSponsorPreview));
      sponsorShowcase.append(titleGroup);
    }

    sponsorCategories.forEach((category) => {
      if (category === "Title Sponsor") {
        return;
      }

      const categorySponsors = sortedSponsors.filter((sponsor) => sponsor.category === category);
      if (categorySponsors.length === 0) {
        return;
      }

      const categorySection = document.createElement("section");
      categorySection.className = "sponsor-category-section";
      const heading = document.createElement("h3");
      heading.className = "sponsor-category-heading";
      heading.textContent = showingSponsorPreview ? `SAMPLE PREVIEW · ${category}` : category;
      const cardGrid = document.createElement("div");
      cardGrid.className = "sponsor-card-grid reveal-stagger";
      categorySponsors.forEach((sponsor) => cardGrid.append(createSponsorCard(sponsor, false, showingSponsorPreview)));
      categorySection.append(heading, cardGrid);
      sponsorShowcase.append(categorySection);
    });
  }

  const sponsorshipButton = document.querySelector("[data-sponsorship-trigger]");
  const sponsorshipStatus = document.querySelector("[data-sponsorship-status]");
  const configuredSponsorshipUrl = typeof config.sponsorshipContactUrl === "string" ? config.sponsorshipContactUrl.trim() : "";
  let safeSponsorshipDestination = "";

  if (configuredSponsorshipUrl) {
    try {
      const parsedUrl = new URL(configuredSponsorshipUrl);
      if (parsedUrl.protocol === "https:" && parsedUrl.hostname && !parsedUrl.username && !parsedUrl.password) {
        safeSponsorshipDestination = parsedUrl.href;
      } else if (parsedUrl.protocol === "mailto:" && /^[^/?#\s]+@[^/?#\s]+\.[^/?#\s]+$/.test(parsedUrl.pathname)) {
        safeSponsorshipDestination = parsedUrl.href;
      }
    } catch {
      safeSponsorshipDestination = "";
    }
  }

  if (sponsorshipButton) {
    sponsorshipButton.addEventListener("click", () => {
      if (safeSponsorshipDestination) {
        window.location.assign(safeSponsorshipDestination);
        return;
      }

      if (sponsorshipStatus) {
        sponsorshipStatus.textContent = "A sponsorship contact destination has not been configured yet. Please check back soon.";
      }
    });
  }

  const committeeMembers = Array.isArray(config.committeeMembers) ? config.committeeMembers : [];
  const committeeDemoMembers = config.committeeDemoMode === true && window.location.protocol === "file:" && committeeMembers.length === 0 && Array.isArray(config.committeeDemoMembers)
    ? config.committeeDemoMembers.filter((member) => member && member.demoOnly === true && member.confirmed === false && typeof member.name === "string" && member.name.trim() && typeof member.role === "string" && member.role.trim())
    : [];
  const displayedCommitteeMembers = committeeMembers.length > 0 ? committeeMembers : committeeDemoMembers;
  const showingCommitteeDemo = committeeMembers.length === 0 && committeeDemoMembers.length > 0;

  if (showingCommitteeDemo) {
    const demoBanner = document.createElement("p");
    demoBanner.className = "committee-demo-banner";
    demoBanner.textContent = "LOCAL PREVIEW ONLY · SAMPLE PROFILES · NOT REAL FACULTY";
    document.querySelector(".committee-sections")?.prepend(demoBanner);
  }

  const getCommitteeImagePath = (path) => {
    if (typeof path !== "string" || !path.trim()) {
      return "";
    }

    const imagePath = path.trim();
    const pathSegments = imagePath.split(/[?#]/)[0].split(/[\\/]/);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i.test(imagePath) || pathSegments.includes("..")) {
      return "";
    }

    return imagePath;
  };

  document.querySelectorAll("[data-committee-category]").forEach((section) => {
    const category = section.dataset.committeeCategory;
    const categoryMembers = displayedCommitteeMembers
      .filter((member) => member && member.category === category && typeof member.name === "string" && member.name.trim() && typeof member.role === "string" && member.role.trim() && (showingCommitteeDemo || member.confirmed === true))
      .sort((first, second) => {
        const firstOrder = Number.isFinite(first.displayOrder) ? first.displayOrder : 0;
        const secondOrder = Number.isFinite(second.displayOrder) ? second.displayOrder : 0;
        return firstOrder - secondOrder;
      });

    if (categoryMembers.length === 0) {
      return;
    }

    const emptyState = section.querySelector(".committee-empty");
    if (emptyState) {
      emptyState.remove();
    }

    const grid = section.querySelector("[data-committee-grid]");
    categoryMembers.forEach((member) => {
      const card = document.createElement("article");
      card.className = "committee-card glass-panel";

      if (showingCommitteeDemo) {
        const demoLabel = document.createElement("p");
        demoLabel.className = "committee-demo-label";
        demoLabel.textContent = "DEMO · NOT A REAL PERSON";
        card.append(demoLabel);
      }

      const photo = document.createElement("div");
      photo.className = "committee-photo";
      const imagePath = getCommitteeImagePath(member.photo);
      if (imagePath) {
        photo.classList.add("has-photo");
        const image = document.createElement("img");
        image.src = imagePath;
        image.alt = `${member.name.trim()} portrait`;
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener("error", () => {
          image.remove();
          photo.classList.remove("has-photo");
        }, { once: true });
        photo.append(image);
      }

      const photoPlaceholder = document.createElement("span");
      photoPlaceholder.className = "committee-photo-placeholder";
      photoPlaceholder.setAttribute("aria-hidden", "true");
      photo.append(photoPlaceholder);
      card.append(photo);

      const details = document.createElement("div");
      details.className = "committee-card-details";
      const name = document.createElement("h3");
      name.textContent = member.name.trim();
      const role = document.createElement("p");
      role.className = "committee-role";
      role.textContent = member.role.trim();
      details.append(name, role);

      if (typeof member.department === "string" && member.department.trim()) {
        const department = document.createElement("p");
        department.className = "committee-department";
        department.textContent = member.department.trim();
        details.append(department);
      }

      if (typeof member.biography === "string" && member.biography.trim()) {
        const biography = document.createElement("p");
        biography.className = "committee-biography";
        biography.textContent = member.biography.trim();
        details.append(biography);
      }

      grid.append(card);
    });
  });

  const faqPage = document.querySelector("[data-faq-page]");
  if (faqPage) {
    const faqItems = [...faqPage.querySelectorAll("[data-faq-item]")];
    const faqSections = [...faqPage.querySelectorAll("[data-faq-section]")];
    const filterButtons = [...faqPage.querySelectorAll("[data-faq-filter]")];
    const searchInput = faqPage.querySelector("[data-faq-search]");
    const emptyState = faqPage.querySelector("[data-faq-empty]");
    let activeCategory = "all";

    faqItems.forEach((item) => {
      const button = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      item.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
      answer.setAttribute("aria-hidden", "true");

      button.addEventListener("click", () => {
        const isOpen = item.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(isOpen));
        answer.setAttribute("aria-hidden", String(!isOpen));
      });
    });

    const updateFaqResults = () => {
      const query = searchInput.value.trim().toLowerCase();
      let visibleCount = 0;

      faqSections.forEach((section) => {
        const categoryMatches = activeCategory === "all" || section.dataset.faqSection === activeCategory;
        let sectionCount = 0;

        section.querySelectorAll("[data-faq-item]").forEach((item) => {
          const textMatches = !query || item.textContent.toLowerCase().includes(query);
          const isVisible = categoryMatches && textMatches;
          item.hidden = !isVisible;
          sectionCount += Number(isVisible);
        });

        section.hidden = sectionCount === 0;
        visibleCount += sectionCount;
      });

      emptyState.hidden = visibleCount > 0;
    };

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.faqFilter;
        filterButtons.forEach((filter) => {
          const isActive = filter === button;
          filter.setAttribute("aria-pressed", String(isActive));
          filter.classList.toggle("is-active", isActive);
        });
        updateFaqResults();
      });
    });

    searchInput.addEventListener("input", updateFaqResults);
    faqPage.classList.add("faq-enhanced");
  }

  const siteHeader = document.querySelector("[data-site-header]");
  const menuToggle = siteHeader?.querySelector(".menu-toggle");
  const siteNav = siteHeader?.querySelector(".site-nav");
  const mobileBreakpoint = window.matchMedia("(max-width: 860px)");

  if (siteHeader && menuToggle && siteNav) {
    siteHeader.classList.add("nav-enhanced");
    siteNav.inert = mobileBreakpoint.matches;

    const closeMenu = (returnFocus = false) => {
      siteHeader.classList.remove("is-menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      siteNav.inert = mobileBreakpoint.matches;
      if (returnFocus) {
        menuToggle.focus();
      }
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = siteHeader.classList.toggle("is-menu-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
      siteNav.inert = mobileBreakpoint.matches && !isOpen;
    });

    siteNav.addEventListener("click", (event) => {
      if (event.target.closest(".nav-link")) {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (!siteHeader.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && siteHeader.classList.contains("is-menu-open")) {
        closeMenu(true);
      }
    });

    const onBreakpointChange = (event) => {
      if (!event.matches) {
        closeMenu();
      } else {
        siteNav.inert = !siteHeader.classList.contains("is-menu-open");
      }
    };

    if (mobileBreakpoint.addEventListener) {
      mobileBreakpoint.addEventListener("change", onBreakpointChange);
    } else {
      mobileBreakpoint.addListener(onBreakpointChange);
    }

    let scrollFrame = 0;
    const updateScrollState = () => {
      if (scrollFrame) {
        return;
      }

      scrollFrame = window.requestAnimationFrame(() => {
        const hasScrolled = window.scrollY > 24;
        siteHeader.classList.toggle("is-scrolled", hasScrolled);
        document.querySelector(".footer-back-top")?.classList.toggle("is-prominent", hasScrolled);
        scrollFrame = 0;
      });
    };

    window.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
  }

  document.querySelectorAll(".footer-back-top").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
})();
