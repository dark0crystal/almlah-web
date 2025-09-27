import React from 'react'
import { projects } from './data'

interface ProjectsProps {
  setActiveMenu: (index: number | null) => void;
}

const Projects: React.FC<ProjectsProps> = ({ setActiveMenu }) => {
  return (
    <div className='relative z-10 md:mix-blend-difference h-screen w-full'>
      <ul onMouseLeave={() => {setActiveMenu(null)}}>
        {
          projects.map((project, i) => {
            return (
              <li onMouseOver={() => {setActiveMenu(i)}} key={project.title} className='p-5'>
                <p className='text-[4vw] font-bold md:text-[3vw] md:font-normal text-black md:text-white'>{project.title}</p>
              </li>
            )
          })
        }
      </ul>
    </div>
  )
}

export default Projects;