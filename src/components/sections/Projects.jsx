import { memo } from 'react';
import { ProjectCard } from '../ui/Card.jsx';
import { projects } from '../../data/appData.js';

const Projects = memo(function Projects() {
  return (
    <section className="section compact-section" id="projects">
      <div>
        <p className="eyebrow">Projects</p>
        <h2>Portfolio Projects</h2>
      </div>
      <div className="mini-list">
        {projects.map(p => (
          <ProjectCard key={p.title} {...p} />
        ))}
      </div>
    </section>
  );
});

export default Projects;
